/**
 * The plugin's configuration page, registered at `plugins.row.config` so it
 * opens from the plugin's row on the Plugins page (a left-sidebar panel in
 * DSH 0.2.x). The same component answers `view: 'summary'` with the one-line
 * description that page shows for a row without one.
 */
import { useState, type ChangeEvent, type CSSProperties, type ReactNode } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import { DEFAULT_SKIN, SKIN_NS, UPLOAD_MAX_BYTES, type SkinConfig } from '../skin-config.ts'
import { resolveIconSource } from './art.ts'
import type { ObservableSource } from './patcher.ts'

/** The business face this registration injects. */
export interface SkinInjected {
  /** Bare sources bound to `use<Name>` selector hooks. */
  readonly hooks: { readonly config: ObservableSource<SkinConfig> }
  /** Persist a configuration and republish it. */
  readonly save: (patch: Partial<SkinConfig>) => Promise<SkinConfig>
  /** Persist the shipped preset and republish it. */
  readonly reset: () => Promise<SkinConfig>
}

/** Complete props of the registered page. */
export type SkinPanelProps = PropsRuntime<'plugins.row.config'> & InjectFace<SkinInjected> & PropsLocale<typeof SKIN_NS>

type SaveState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'saving' | 'saved' }
  | { readonly kind: 'failed'; readonly detail: string }

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '640px', color: 'var(--dsw-alias-label-primary, inherit)' },
  field: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '13px', fontWeight: 600 },
  hint: { margin: 0, color: 'var(--dsw-alias-label-tertiary, #888)', fontSize: '12px', lineHeight: '18px' },
  row: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  input: { font: 'inherit', padding: '4px 8px', color: 'inherit', border: '1px solid var(--dsw-alias-border-l2, #555)', borderRadius: '6px', background: 'var(--dsw-alias-bg-layer-1, transparent)' },
  preview: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', overflow: 'hidden' },
  previewImage: { width: '28px', height: '28px', objectFit: 'contain' },
  button: { font: 'inherit', cursor: 'pointer', padding: '4px 12px', color: 'inherit', border: '1px solid var(--dsw-alias-border-l2, #555)', borderRadius: '6px', background: 'var(--dsw-alias-bg-layer-1, transparent)' },
  ok: { color: 'var(--dsw-alias-state-success-primary, #3c3)', fontSize: '13px' },
  error: { color: 'var(--dsw-alias-state-error-primary, #c33)', fontSize: '13px' },
} satisfies Record<string, CSSProperties>

/** Read one file as a data URI. */
export function toDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('the file reader produced a non-string result'))
    }
    reader.onerror = () => { reject(reader.error ?? new Error('the file could not be read')) }
    reader.readAsDataURL(file)
  })
}

/** Whole kilobytes, rounded up so an over-limit file never reads as the limit. */
function kilobytes(bytes: number): number {
  return Math.max(1, Math.ceil(bytes / 1024))
}

function failureText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** `<input type="color">` accepts only a six-digit hex value. */
function hexColor(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#e60012'
}

/**
 * Render the plugin's row configuration page.
 * @param props - composed slot props and the injected settings face.
 * @returns the settings form, or the row's one-line description.
 */
export function SkinPanel({ view, useConfig, t, save, reset }: SkinPanelProps): ReactNode {
  const config = useConfig(current => current)
  const [draft, setDraft] = useState<SkinConfig>(config)
  const [seeded, setSeeded] = useState<SkinConfig>(config)
  const [state, setState] = useState<SaveState>({ kind: 'idle' })

  // Re-seed the draft when the stored configuration moves under us (the first
  // read landing, or another writer). Editing state is left untouched because
  // only the snapshot identity, not the keystrokes, drives this branch.
  if (seeded !== config) {
    setSeeded(config)
    setDraft(config)
  }

  if (view === 'summary') return t('summary')

  const edit = (patch: Partial<SkinConfig>): void => {
    setDraft(current => ({ ...current, ...patch }))
    setState({ kind: 'idle' })
  }

  const commit = async (write: () => Promise<SkinConfig>): Promise<void> => {
    setState({ kind: 'saving' })
    try {
      await write()
      setState({ kind: 'saved' })
    } catch (error) {
      setState({ kind: 'failed', detail: failureText(error) })
    }
  }

  const onFile = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    // Clearing lets the same file be picked again after an edit.
    event.target.value = ''
    if (file === undefined) return
    if (file.size > UPLOAD_MAX_BYTES) {
      setState({
        kind: 'failed',
        detail: t('iconTooLarge', { kb: kilobytes(file.size), limit: kilobytes(UPLOAD_MAX_BYTES) }),
      })
      return
    }
    void toDataUrl(file).then(
      (dataUrl) => { edit({ icon: dataUrl }) },
      (error: unknown) => { setState({ kind: 'failed', detail: failureText(error) }) },
    )
  }

  const dataIcon = draft.icon.startsWith('data:')
  const busy = state.kind === 'saving'

  return (
    <div style={styles.wrap}>
      <div style={styles.field}>
        <span style={styles.label}>{t('title')}</span>
        <p style={styles.hint}>{t('intro')}</p>
      </div>

      <div style={styles.field}>
        <span style={styles.label}>{t('iconLabel')}</span>
        <div style={styles.row}>
          <span style={styles.preview}>
            <img style={styles.previewImage} src={resolveIconSource(draft.icon)} alt={t('iconPreview')} />
          </span>
          <input type="file" accept="image/svg+xml,image/gif,image/webp,image/png" onChange={onFile} />
          {draft.icon === ''
            ? null
            : <button type="button" style={styles.button} onClick={() => { edit({ icon: '' }) }}>{t('iconClear')}</button>}
        </div>
        {dataIcon
          ? <p style={styles.hint}>{t('iconIsData', { kb: kilobytes(draft.icon.length) })}</p>
          : (
            <label style={styles.field}>
              <span style={styles.hint}>{t('iconUrlLabel')}</span>
              <input
                style={styles.input}
                type="text"
                value={draft.icon}
                placeholder={t('iconUrlPlaceholder')}
                onChange={(event) => { edit({ icon: event.target.value }) }}
              />
            </label>
          )}
        <p style={styles.hint}>{t('iconHint')}</p>
      </div>

      <label style={styles.field}>
        <span style={styles.label}>{t('textLabel')}</span>
        <input
          style={styles.input}
          type="text"
          value={draft.text}
          onChange={(event) => { edit({ text: event.target.value }) }}
        />
        <span style={styles.hint}>{t('textHint')}</span>
      </label>

      <div style={styles.field}>
        <span style={styles.label}>{t('colorLabel')}</span>
        <div style={styles.row}>
          <input
            type="color"
            value={hexColor(draft.color)}
            onChange={(event) => { edit({ color: event.target.value }) }}
          />
          <input
            style={styles.input}
            type="text"
            value={draft.color}
            onChange={(event) => { edit({ color: event.target.value }) }}
          />
        </div>
        <p style={styles.hint}>{t('colorHint')}</p>
      </div>

      <div style={styles.field}>
        <label style={styles.row}>
          <input
            type="checkbox"
            checked={draft.spin}
            onChange={(event) => { edit({ spin: event.target.checked }) }}
          />
          <span style={styles.label}>{t('spinLabel')}</span>
        </label>
        <label style={styles.row}>
          <span style={styles.hint}>{t('spinSecondsLabel')}</span>
          <input
            style={styles.input}
            type="number"
            min={0.2}
            max={60}
            step={0.1}
            value={draft.spinSeconds}
            onChange={(event) => { edit({ spinSeconds: Number(event.target.value) }) }}
          />
        </label>
        <p style={styles.hint}>{t('spinSecondsHint')}</p>
      </div>

      <div style={styles.row}>
        <button type="button" style={styles.button} disabled={busy} onClick={() => { void commit(() => save(draft)) }}>
          {busy ? t('saving') : t('save')}
        </button>
        <button
          type="button"
          style={styles.button}
          disabled={busy}
          onClick={() => { setDraft({ ...DEFAULT_SKIN }); void commit(() => reset()) }}
        >
          {t('resetAll')}
        </button>
        {state.kind === 'saved' ? <span style={styles.ok}>{t('saved')}</span> : null}
        {state.kind === 'failed' ? <span style={styles.error}>{t('saveFailed')}{state.detail}</span> : null}
      </div>
    </div>
  )
}
