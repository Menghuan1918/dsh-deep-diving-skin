/**
 * This plugin's settings document. One plain JSON file under the harness home,
 * owned by this plugin alone: the harness settings RPC serves profile entries
 * by row id, and a plugin-owned document keeps the icon blob out of the profile
 * patch while surviving a browser change.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { resolveDshHome } from './dsh-home.ts'
import { DEFAULT_SKIN, normalizeSkinConfig, type SkinConfig } from './skin-config.ts'

/** File name of the settings document under the harness home. */
const SETTINGS_FILE_NAME = 'deep-diving-skin.json'

/**
 * Absolute path of the settings document.
 * @param home - harness home; defaults to the process environment's.
 * @returns the document path.
 */
export function skinConfigPath(home: string = resolveDshHome()): string {
  return join(home, SETTINGS_FILE_NAME)
}

/**
 * Read the settings document. A missing, unreadable, or malformed document
 * resolves to the shipped preset field by field, so the skin always has a
 * usable configuration.
 * @param file - absolute document path.
 * @returns the stored configuration, or the defaults.
 */
export function readSkinConfig(file: string): SkinConfig {
  try {
    return normalizeSkinConfig(JSON.parse(readFileSync(file, 'utf8')))
  } catch {
    // Absent is the ordinary first-run case; unreadable or malformed joins it,
    // because the shipped preset is always a usable configuration.
    return { ...DEFAULT_SKIN }
  }
}

/**
 * Replace the settings document with a normalized configuration.
 * @param file - absolute document path.
 * @param value - configuration to persist.
 * @returns the normalized value that was written.
 */
export function writeSkinConfig(file: string, value: unknown): SkinConfig {
  const normalized = normalizeSkinConfig(value)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, `${JSON.stringify(normalized, null, 2)}\n`)
  return normalized
}
