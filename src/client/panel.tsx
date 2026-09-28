/**
 * The plugin's settings page. One component serves both registration sites:
 * the Plugins page asks for `view: 'summary'` (its one-line description) or
 * `view: 'page'` (the form), and the Settings section renders the form alone.
 * Styling comes from the injected `dds-` stylesheet in `styles.ts`.
 */
import { useState, type ChangeEvent, type ReactNode } from 'react'
import type { InjectFace, PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { DEFAULT_SKIN, SKIN_FIELDS, SKIN_NS, SPIN_DIRECTIONS, UPLOAD_MAX_BYTES, type SkinConfig } from '../skin-config.ts'
import { resolveIconSource } from './art.ts'
import type { ObservableSource } from './patcher.ts'

/** The business face this registration injects. */
export interface SkinInjected {
  /** Bare sources bound to `use<Name>` selector hooks. */
  readonly hooks: { readonly config: ObservableSource<SkinConfig> }
  /** Persist a configuration and republish it. */
  readonly save: (patch: Partial<SkinConfig>) => Promise<SkinConfig>
  /** Persist the shipped defaults and republish them. */
  readonly reset: () => Promise<SkinConfig>
}

/**
 * Props this component reads. `view` is absent when the Settings section
 * mounts it — that host always wants the form — so it stays optional rather
 * than being re-typed per slot.
 */
export type SkinPanelProps = {
  readonly view?: 'summary' | 'page' | undefined
} & InjectFace<SkinInjected> & PropsLocale<typeof SKIN_NS>

type SaveState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'saving' }
  | { readonly kind: 'saved'; readonly ignored: readonly string[] }
  | { readonly kind: 'failed'; readonly detail: string }

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
 * Render the settings form.
 * @param props - the slot props plus the injected settings face.
 * @returns the row's one-line description, or the form.
 */
export function SkinPanel({ view, useConfig, t, save, reset }: SkinPanelProps): ReactNode {
  const config = useConfig(current => current)
  const [draft, setDraft] = useState<SkinConfig>(config)
  const [seeded, setSeeded] = useState<SkinConfig>(config)
  const [state, setState] = useState<SaveState>({ kind: 'idle' })

  // Re-seed the draft when the stored configuration moves under us (the first
  // read landing, or another writer). In-progress edits survive because only
  // the snapshot identity, not the keystrokes, drives this branch.
  if (seeded !== config) {
    setSeeded(config)
    setDraft(config)
  }

  if (view === 'summary') return t('summary')

  const edit = (patch: Partial<SkinConfig>): void => {
    setDraft(current => ({ ...current, ...patch }))
    setState({ kind: 'idle' })
  }

  /**
   * Write, then compare what came back with what was sent. A host older than
   * the field list answers 200 and drops what it does not know, which would
   * otherwise look like a save that silently did nothing.
   */
  const commit = async (sent: SkinConfig, write: () => Promise<SkinConfig>): Promise<void> => {
    setState({ kind: 'saving' })
    try {
      const accepted = await write()
      setState({ kind: 'saved', ignored: SKIN_FIELDS.filter(field => accepted[field] !== sent[field]) })
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

  const busy = state.kind === 'saving'

  return (
    <div className="dds-page">
      <div className="dds-field">
        <span className="dds-card-title">{t('title')}</span>
        <p className="dds-hint">{t('intro')}</p>
      </div>

      <section className="dds-card">
        <span className="dds-label">{t('iconLabel')}</span>
        <div className="dds-row">
          <span className="dds-preview">
            <img className="dds-preview-image" src={resolveIconSource(draft.icon)} alt={t('iconPreview')} />
          </span>
          <input
            className="dds-picker"
            type="file"
            accept="image/svg+xml,image/gif,image/webp,image/png"
            onChange={onFile}
          />
          <button
            className="dds-button"
            type="button"
            disabled={busy || draft.icon === ''}
            onClick={() => { edit({ icon: '' }) }}
          >
            {t('iconClear')}
          </button>
        </div>
        {draft.icon.startsWith('data:')
          ? <p className="dds-hint">{t('iconIsData', { kb: kilobytes(draft.icon.length) })}</p>
          : (
            <label className="dds-field">
              <span className="dds-hint">{t('iconUrlLabel')}</span>
              <input
                className="dds-input"
                type="text"
                value={draft.icon}
                placeholder={t('iconUrlPlaceholder')}
                onChange={(event) => { edit({ icon: event.target.value }) }}
              />
            </label>
          )}
        <p className="dds-hint">{t('iconHint')}</p>
      </section>

      <section className="dds-card">
        <label className="dds-field">
          <span className="dds-label">{t('textLabel')}</span>
          <input
            className="dds-input"
            type="text"
            value={draft.text}
            onChange={(event) => { edit({ text: event.target.value }) }}
          />
        </label>
        <p className="dds-hint">{t('textHint')}</p>
        <div className="dds-field">
          <span className="dds-label">{t('colorLabel')}</span>
          <div className="dds-row">
            <input
              className="dds-color"
              type="color"
              aria-label={t('colorLabel')}
              value={hexColor(draft.color)}
              onChange={(event) => { edit({ color: event.target.value }) }}
            />
            <input
              className="dds-input"
              type="text"
              value={draft.color}
              onChange={(event) => { edit({ color: event.target.value }) }}
            />
          </div>
          <p className="dds-hint">{t('colorHint')}</p>
        </div>
        <div className="dds-field">
          <span className="dds-label">{t('shimmerLabel')}</span>
          <div className="dds-row">
            <input
              className="dds-color"
              type="color"
              aria-label={t('shimmerLabel')}
              value={hexColor(draft.shimmerColor)}
              onChange={(event) => { edit({ shimmerColor: event.target.value }) }}
            />
            <input
              className="dds-input"
              type="text"
              value={draft.shimmerColor}
              onChange={(event) => { edit({ shimmerColor: event.target.value }) }}
            />
          </div>
          <p className="dds-hint">{t('shimmerHint')}</p>
        </div>
      </section>

      <section className="dds-card">
        <label className="dds-row">
          <input
            type="checkbox"
            checked={draft.spin}
            onChange={(event) => { edit({ spin: event.target.checked }) }}
          />
          <span className="dds-label">{t('spinLabel')}</span>
        </label>
        <label className="dds-row">
          <span className="dds-hint">{t('spinSecondsLabel')}</span>
          <input
            className="dds-input dds-input-number"
            type="number"
            min={0.2}
            max={60}
            step={0.1}
            value={draft.spinSeconds}
            onChange={(event) => { edit({ spinSeconds: Number(event.target.value) }) }}
          />
        </label>
        <p className="dds-hint">{t('spinSecondsHint')}</p>
        <label className="dds-row">
          <span className="dds-hint">{t('spinDirectionLabel')}</span>
          <select
            className="dds-input dds-input-number"
            value={draft.spinDirection}
            onChange={(event) => { edit({ spinDirection: event.target.value as SkinConfig['spinDirection'] }) }}
          >
            {SPIN_DIRECTIONS.map(direction => (
              <option key={direction} value={direction}>
                {direction === 'clockwise' ? t('spinClockwise') : t('spinCounterclockwise')}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div className="dds-actions">
        <button
          className="dds-button dds-button-primary"
          type="button"
          disabled={busy}
          onClick={() => { void commit(draft, () => save(draft)) }}
        >
          {busy ? t('saving') : t('save')}
        </button>
        <button
          className="dds-button"
          type="button"
          disabled={busy}
          onClick={() => { setDraft({ ...DEFAULT_SKIN }); void commit({ ...DEFAULT_SKIN }, () => reset()) }}
        >
          {t('resetAll')}
        </button>
        {state.kind === 'saved' && state.ignored.length === 0
          ? <span className="dds-status dds-status-ok">{t('saved')}</span>
          : null}
        {state.kind === 'saved' && state.ignored.length > 0
          ? (
            <span className="dds-status dds-status-error">
              {t('fieldIgnored', { fields: state.ignored.join(', ') })}
            </span>
          )
          : null}
        {state.kind === 'failed'
          ? <span className="dds-status dds-status-error">{t('saveFailed')}{state.detail}</span>
          : null}
      </div>
    </div>
  )
}
