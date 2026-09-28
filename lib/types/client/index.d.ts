/**
 * dsh-deep-diving-skin — browser half.
 *
 * Two jobs: keep the running-status line skinned (see `patcher.ts`), and offer
 * the plugin's configuration page on the Plugins page, which in DSH 0.2.x is a
 * left-sidebar panel whose per-row configuration page is the
 * `plugins.row.config` keyed seat.
 */
import type { Context } from '@deepseek-ai/cordis';
/** Services this half needs: the slot registry and the locale registry. */
export declare const inject: string[];
/**
 * Register the dictionaries, start the skin, and contribute the row's
 * configuration page.
 * @param ctx - client plugin context.
 */
export declare function apply(ctx: Context): void;
