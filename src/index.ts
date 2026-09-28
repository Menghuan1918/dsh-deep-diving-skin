/**
 * Host half. The visible work happens in the browser half; this row exists so
 * the package is a loader entry (the client-modules scan keys off loader
 * entries) and so the settings document has an owner.
 */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import { registerSkinRoutes } from './routes.ts'
import { skinConfigPath } from './store.ts'

/** Cordis plugin name. The profile row id is declared by cordis.patch.yml. */
export const name = 'dsh-deep-diving-skin'

/** Row configuration accepted from cordis.patch.yml. */
export interface SkinRowConfig {
  /** Reverse-proxy authorities additionally allowed to call the settings API. */
  readonly trustedHosts?: readonly string[]
}

/**
 * Register the settings API the browser half reads and writes.
 * @param ctx - host plugin context.
 * @param config - row configuration.
 */
export function apply(ctx: Context, config?: SkinRowConfig): void {
  const trustedHosts = (config?.trustedHosts ?? []).filter(entry => typeof entry === 'string')
  const configPath = skinConfigPath()
  // A web server is absent from some compositions (headless); the row must
  // still mount there, so the route waits for the service instead of declaring
  // it as a plugin-level injection.
  ctx.inject(['webServer'], (webCtx) => {
    registerSkinRoutes(webCtx, { trustedHosts, configPath })
  })
}
