/**
 * The live configuration the skin and the settings page share.
 *
 * The host document is authoritative; this module keeps one snapshot of it, an
 * observable source for the renderer's `hooks` compartment, and the two write
 * paths. A failed read leaves the shipped preset in place rather than blanking
 * the skin, because the plugin's job is to look like something.
 */
import { SKIN_API_PATH, DEFAULT_SKIN, normalizeSkinConfig, type SkinConfig } from '../skin-config.ts'
import type { ObservableSource } from './patcher.ts'

/** What the settings page and the patcher consume. */
export interface SkinStore {
  /** Current configuration; identity changes only when the value does. */
  readonly config: ObservableSource<SkinConfig>
  /** Read the host document, keeping the shipped preset when it is unreachable. */
  load(): Promise<void>
  /**
   * Write a configuration.
   * @param patch - fields to change; the rest keeps its current value.
   * @returns the configuration the host accepted.
   */
  save(patch: Partial<SkinConfig>): Promise<SkinConfig>
  /** Restore every field to the shipped preset. */
  reset(): Promise<SkinConfig>
}

interface ApiPayload {
  readonly ok?: unknown
  readonly value?: unknown
  readonly error?: { readonly message?: unknown }
}

/**
 * Create the store for one plugin instance.
 * @returns the store over a fresh snapshot.
 */
export function createSkinStore(): SkinStore {
  let snapshot: SkinConfig = { ...DEFAULT_SKIN }
  const listeners = new Set<() => void>()

  const config: ObservableSource<SkinConfig> = {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }

  const publish = (next: SkinConfig): SkinConfig => {
    snapshot = next
    for (const listener of [...listeners]) listener()
    return next
  }

  const request = async (method: 'GET' | 'PUT', body?: SkinConfig): Promise<SkinConfig> => {
    const response = await fetch(SKIN_API_PATH, {
      method,
      ...body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) },
    })
    const text = await response.text()
    let payload: ApiPayload
    try {
      payload = JSON.parse(text) as ApiPayload
    } catch {
      throw new Error(`settings API answered HTTP ${String(response.status)} with a non-JSON body`)
    }
    if (!response.ok || payload.ok !== true) {
      const message = payload.error?.message
      throw new Error(typeof message === 'string' ? message : `settings API answered HTTP ${String(response.status)}`)
    }
    return publish(normalizeSkinConfig(payload.value))
  }

  return {
    config,
    async load(): Promise<void> {
      try {
        await request('GET')
      } catch (error) {
        console.warn('dsh-deep-diving-skin: settings unavailable, keeping the shipped preset', error)
      }
    },
    save(patch): Promise<SkinConfig> {
      return request('PUT', { ...snapshot, ...patch })
    },
    reset(): Promise<SkinConfig> {
      return request('PUT', { ...DEFAULT_SKIN })
    },
  }
}
