/**
 * dsh-deep-diving-skin — browser half.
 *
 * Two jobs: keep the running-status line skinned (see `patcher.ts`), and offer
 * the plugin's configuration page on the Plugins page, which in DSH 0.2.x is a
 * left-sidebar panel whose per-row configuration page is the
 * `plugins.row.config` keyed seat.
 */
import type { Context } from '@deepseek-ai/cordis'
// Type-only: the `ctx.locale` and `ctx.slots` Context members these two
// packages declare, plus plugin-manager's SlotMap row and ui-slots' shares.
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import { SKIN_NS, SKIN_ROW_CONFIG_KEY } from '../skin-config.ts'
import { en, zh } from './locales.ts'
import { SkinPanel, type SkinInjected } from './panel.tsx'
import { startSkin } from './patcher.ts'
import { createSkinStore } from './store.ts'

/** Services this half needs: the slot registry and the locale registry. */
export const inject = ['slots', 'locale']

/**
 * Register the dictionaries, start the skin, and contribute the row's
 * configuration page.
 * @param ctx - client plugin context.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(SKIN_NS, { zh, en }), 'deep-diving-skin: dictionaries')
  const store = createSkinStore()

  ctx.effect(() => startSkin(store.config), 'deep-diving-skin: running-status skin')
  // A failed read is not fatal: the shipped preset stays on screen and the next
  // page load retries.
  void store.load()

  ctx.slots.inject('plugins.row.config', () => ctx.slots.register({
    name: 'plugins.row.config',
    key: SKIN_ROW_CONFIG_KEY,
    locale: SKIN_NS,
    inject: (): SkinInjected => ({
      hooks: { config: store.config },
      save: store.save,
      reset: store.reset,
    }),
  }, SkinPanel))
}
