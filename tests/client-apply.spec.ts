// @vitest-environment jsdom
/**
 * `apply` must contribute the settings page to BOTH seats — the plugin's row
 * on the Plugins page and a section of the Settings dialog — and share one
 * configuration source between them. The context here is a test double for the
 * cordis container: it records what the plugin asks for.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import { apply, SETTINGS_SECTION_ID } from '../src/client/index.tsx'
import { zh } from '../src/client/locales.ts'
import { SKIN_NS, SKIN_ROW_CONFIG_KEY } from '../src/skin-config.ts'

interface Registration {
  readonly name: string
  readonly options: Record<string, unknown>
  readonly component: unknown
}

interface Harness {
  readonly ctx: Context
  readonly registrations: Registration[]
  readonly injectedSlots: string[]
  readonly effectLabels: string[]
  readonly localeNamespaces: string[]
  readonly disposers: (() => void)[]
  readonly warnings: string[]
}

function createHarness(): Harness {
  const registrations: Registration[] = []
  const injectedSlots: string[] = []
  const effectLabels: string[] = []
  const localeNamespaces: string[] = []
  const disposers: (() => void)[] = []
  const warnings: string[] = []

  const slots = {
    inject(name: string, callback: () => () => void) {
      injectedSlots.push(name)
      const dispose = callback()
      disposers.push(dispose)
      return dispose
    },
    register(options: Record<string, unknown>, component: unknown) {
      registrations.push({ name: String(options.name), options, component })
      return () => {}
    },
  }
  const locale = {
    register(ns: string) {
      localeNamespaces.push(ns)
      return () => {}
    },
    bind: () => (key: keyof typeof zh) => zh[key],
  }
  const ctx = {
    effect: (callback: () => () => void, label?: string) => {
      effectLabels.push(String(label))
      const dispose = callback()
      disposers.push(dispose)
      return dispose
    },
    locale,
    slots,
  }
  // The double covers exactly the three members `apply` touches; casting is
  // cheaper than modelling the container's full surface.
  return { ctx: ctx as unknown as Context, registrations, injectedSlots, effectLabels, localeNamespaces, disposers, warnings }
}

afterEach(() => { vi.unstubAllGlobals() })

describe('client apply', () => {
  it('contributes the page to both seats with one shared configuration source', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const harness = createHarness()

    apply(harness.ctx)

    expect(harness.injectedSlots).toEqual(['plugins.row.config', 'settings.section'])
    expect(harness.registrations.map(entry => entry.name)).toEqual(['plugins.row.config', 'settings.section'])

    const row = harness.registrations[0]!
    expect(row.options.key).toBe(SKIN_ROW_CONFIG_KEY)
    expect(row.options.locale).toBe(SKIN_NS)

    const section = harness.registrations[1]!
    expect(section.options.id).toBe(SETTINGS_SECTION_ID)
    expect(section.options.order).toBe(60)
    expect(section.options.locale).toBe(SKIN_NS)
    expect((section.options.label as () => string)()).toBe(zh.nav)

    // Both seats read the same observable source, so a save on one republishes
    // to the other.
    const rowFace = (row.options.inject as () => { hooks: { config: unknown } })()
    const sectionFace = (section.options.inject as () => { hooks: { config: unknown } })()
    expect(rowFace.hooks.config).toBe(sectionFace.hooks.config)

    // The plugin's own settings read is floating; let it settle before teardown.
    await new Promise<void>((resolve) => { setTimeout(resolve, 0) })
    for (const dispose of harness.disposers) dispose()
    vi.restoreAllMocks()
  })

  it('registers the namespace, installs the stylesheet and starts the skin', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const harness = createHarness()

    apply(harness.ctx)

    expect(harness.localeNamespaces).toEqual([SKIN_NS])
    expect(document.querySelector('style[data-dsh-deep-diving-skin-style]')).not.toBeNull()
    expect(harness.effectLabels).toEqual([
      'deep-diving-skin: dictionaries',
      'deep-diving-skin: settings stylesheet',
      'deep-diving-skin: running-status skin',
    ])

    await new Promise<void>((resolve) => { setTimeout(resolve, 0) })
    for (const dispose of harness.disposers) dispose()
    expect(document.querySelector('style[data-dsh-deep-diving-skin-style]')).toBeNull()
    vi.restoreAllMocks()
  })
})
