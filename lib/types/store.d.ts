import { type SkinConfig } from './skin-config.ts';
/**
 * Absolute path of the settings document.
 * @param home - harness home; defaults to the process environment's.
 * @returns the document path.
 */
export declare function skinConfigPath(home?: string): string;
/**
 * Read the settings document. A missing, unreadable, or malformed document
 * resolves to the shipped preset field by field, so the skin always has a
 * usable configuration.
 * @param file - absolute document path.
 * @returns the stored configuration, or the defaults.
 */
export declare function readSkinConfig(file: string): SkinConfig;
/**
 * Replace the settings document with a normalized configuration.
 * @param file - absolute document path.
 * @param value - configuration to persist.
 * @returns the normalized value that was written.
 */
export declare function writeSkinConfig(file: string, value: unknown): SkinConfig;
