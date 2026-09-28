/**
 * Host half. The visible work happens in the browser half; this row exists so
 * the package is a loader entry (the client-modules scan keys off loader
 * entries) and so the settings document has an owner.
 */
import type { Context } from '@deepseek-ai/cordis';
/** Cordis plugin name. The profile row id is declared by cordis.patch.yml. */
export declare const name = "dsh-deep-diving-skin";
/** Row configuration accepted from cordis.patch.yml. */
export interface SkinRowConfig {
    /** Reverse-proxy authorities additionally allowed to call the settings API. */
    readonly trustedHosts?: readonly string[];
}
/**
 * Register the settings API the browser half reads and writes.
 * @param ctx - host plugin context.
 * @param config - row configuration.
 */
export declare function apply(ctx: Context, config?: SkinRowConfig): void;
