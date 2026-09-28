/**
 * dsh-deep-diving-skin — browser half.
 *
 * Three jobs: keep the running-status line skinned (see `patcher.ts`), install
 * the settings stylesheet, and contribute the settings page at both of its
 * seats — the plugin's row on the Plugins page (`plugins.row.config`, a
 * left-sidebar panel in DSH 0.2.x) and a section of the Settings dialog
 * (`settings.section`). One component and one inject face serve both.
 */
import type { Context } from '@deepseek-ai/cordis'
// Type-only: the `ctx.locale` and `ctx.slots` Context members these two
// packages declare, plus plugin-manager's SlotMap row and ui-slots' shares.
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
// Type-only: the 'settings.section' SlotMap row, declared by the settings base.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import { SKIN_NS, SKIN_ROW_CONFIG_KEY } from '../skin-config.ts'
import { en, zh } from './locales.ts'
import { SkinPanel, type SkinInjected } from './panel.tsx'
import { startSkin } from './patcher.ts'
import { createSkinStore } from './store.ts'
import { installStyles } from './styles.ts'

/** Services this half needs: the slot registry and the locale registry. */
export const inject = ['slots', 'locale']

/** Section key of this plugin's page inside the Settings dialog. */
export const SETTINGS_SECTION_ID = 'deep-diving-skin'
/** Nav position of that section; after the shipped ones, so their order stays put. */
const SETTINGS_SECTION_ORDER = 60

/**
 * Register the dictionaries, install the stylesheet, start the skin, and
 * contribute the settings page to both of its seats.
 * @param ctx - client plugin context.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(SKIN_NS, { zh, en }), 'deep-diving-skin: dictionaries')
  const t = ctx.locale.bind(SKIN_NS)
  const store = createSkinStore()
  const injected = (): SkinInjected => ({
    hooks: { config: store.config },
    save: store.save,
    reset: store.reset,
  })

  ctx.effect(() => installStyles(), 'deep-diving-skin: settings stylesheet')
  ctx.effect(() => startSkin(store.config), 'deep-diving-skin: running-status skin')
  // A failed read is not fatal: the defaults stay on screen and the next page
  // load retries.
  void store.load()

  ctx.slots.inject('plugins.row.config', () => ctx.slots.register({
    name: 'plugins.row.config',
    key: SKIN_ROW_CONFIG_KEY,
    locale: SKIN_NS,
    inject: injected,
  }, SkinPanel))

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: SETTINGS_SECTION_ID,
    order: SETTINGS_SECTION_ORDER,
    label: () => t('nav'),
    locale: SKIN_NS,
    inject: injected,
  }, SkinPanel))
}
