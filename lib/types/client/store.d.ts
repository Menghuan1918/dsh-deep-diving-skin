/**
 * The live configuration the skin and the settings page share.
 *
 * The host document is authoritative; this module keeps one snapshot of it, an
 * observable source for the renderer's `hooks` compartment, and the two write
 * paths. A failed read leaves the shipped preset in place rather than blanking
 * the skin, because the plugin's job is to look like something.
 */
import { type SkinConfig } from '../skin-config.ts';
import type { ObservableSource } from './patcher.ts';
/** What the settings page and the patcher consume. */
export interface SkinStore {
    /** Current configuration; identity changes only when the value does. */
    readonly config: ObservableSource<SkinConfig>;
    /** Read the host document, keeping the shipped preset when it is unreachable. */
    load(): Promise<void>;
    /**
     * Write a configuration.
     * @param patch - fields to change; the rest keeps its current value.
     * @returns the configuration the host accepted.
     */
    save(patch: Partial<SkinConfig>): Promise<SkinConfig>;
    /** Restore every field to the shipped preset. */
    reset(): Promise<SkinConfig>;
}
/**
 * Create the store for one plugin instance.
 * @returns the store over a fresh snapshot.
 */
export declare function createSkinStore(): SkinStore;
