/**
 * The client store: what the settings page and the skin read, and how it
 * behaves when the host document is unreachable or malformed.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSkinStore } from '../src/client/store.ts'
import { DEFAULT_SKIN, SKIN_API_PATH, type SkinConfig } from '../src/skin-config.ts'

interface Call {
  readonly url: string
  readonly method: string
  readonly body?: string
}

interface Stub {
  readonly calls: Call[]
  readonly fetch: typeof globalThis.fetch
}

function stubFetch(reply: () => Response | Promise<Response>): Stub {
  const calls: Call[] = []
  const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({
      url: String(input),
      method: init?.method ?? 'GET',
      ...typeof init?.body === 'string' ? { body: init.body } : {},
    })
    return await reply()
  })
  vi.stubGlobal('fetch', fetchImpl)
  return { calls, fetch: fetchImpl as unknown as typeof globalThis.fetch }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

function accepted(config: SkinConfig, status = 200): Response {
  return jsonResponse({ ok: true, value: config }, status)
}

afterEach(() => { vi.unstubAllGlobals() })

describe('client settings store', () => {
  it('starts from the shipped preset', () => {
    expect(createSkinStore().config.getSnapshot()).toEqual(DEFAULT_SKIN)
  })

  it('adopts the host document and notifies observers', async () => {
    stubFetch(() => accepted({ ...DEFAULT_SKIN, text: '祈祷中' }))
    const store = createSkinStore()
    const seen = vi.fn()
    store.config.subscribe(seen)

    await store.load()

    expect(store.config.getSnapshot().text).toBe('祈祷中')
    expect(seen).toHaveBeenCalledTimes(1)
  })

  it('keeps the preset when the host refuses or answers garbage', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const store = createSkinStore()

    stubFetch(() => jsonResponse({ ok: false, error: { message: 'forbidden' } }, 403))
    await store.load()
    expect(store.config.getSnapshot()).toEqual(DEFAULT_SKIN)

    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>', { status: 200 })))
    await store.load()
    expect(store.config.getSnapshot()).toEqual(DEFAULT_SKIN)

    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    await store.load()
    expect(store.config.getSnapshot()).toEqual(DEFAULT_SKIN)
    expect(warn).toHaveBeenCalledTimes(3)
    warn.mockRestore()
  })

  it('writes a patch over the current value', async () => {
    const { calls } = stubFetch(() => accepted({ ...DEFAULT_SKIN, text: '祈祷中', color: '#3366ff' }))
    const store = createSkinStore()

    const saved = await store.save({ text: '祈祷中', color: '#3366ff' })

    expect(saved.text).toBe('祈祷中')
    expect(store.config.getSnapshot().color).toBe('#3366ff')
    expect(calls).toHaveLength(1)
    expect(calls[0]!.url).toBe(SKIN_API_PATH)
    expect(calls[0]!.method).toBe('PUT')
    expect(JSON.parse(calls[0]!.body!)).toEqual({ ...DEFAULT_SKIN, text: '祈祷中', color: '#3366ff' })
  })

  it('restores every field on reset', async () => {
    stubFetch(() => accepted({ ...DEFAULT_SKIN }))
    const store = createSkinStore()
    const { calls } = stubFetch(() => accepted({ ...DEFAULT_SKIN }))

    await store.reset()

    expect(JSON.parse(calls[0]!.body!)).toEqual(DEFAULT_SKIN)
  })

  it('surfaces the host message when a write is refused', async () => {
    stubFetch(() => jsonResponse({ ok: false, error: { message: 'icon must be a URL' } }, 400))
    const store = createSkinStore()

    await expect(store.save({ icon: 'nope' })).rejects.toThrow('icon must be a URL')
    expect(store.config.getSnapshot()).toEqual(DEFAULT_SKIN)
  })
})
