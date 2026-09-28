/**
 * dsh-deep-diving-skin — browser half.
 *
 * Three jobs: keep the running-status line skinned (see `patcher.ts`), install
 * the settings stylesheet, and contribute the settings page at both of its
 * seats — the plugin's row on the Plugins page (`plugins.row.config`, a
 * left-sidebar panel in DSH 0.2.x) and a section of the Settings dialog
 * (`settings.section`). One component and one inject face serve both.
 */
import type { Context } from '@deepseek-ai/cordis';
/** Services this half needs: the slot registry and the locale registry. */
export declare const inject: string[];
/** Section key of this plugin's page inside the Settings dialog. */
export declare const SETTINGS_SECTION_ID = "deep-diving-skin";
/**
 * Register the dictionaries, install the stylesheet, start the skin, and
 * contribute the settings page to both of its seats.
 * @param ctx - client plugin context.
 */
export declare function apply(ctx: Context): void;
