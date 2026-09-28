/**
 * The skin's configuration vocabulary. Imported by BOTH halves of the plugin,
 * so this module stays browser-safe: no Node import, no side effect.
 */

/** Host route serving the persisted configuration. */
export const SKIN_API_PATH = '/deep-diving-skin/api/config'
/** Route prefix the host half registers (loopback + same-origin fenced). */
export const SKIN_API_PREFIX = '/deep-diving-skin/api'
/** Locale namespace owned by this plugin. */
export const SKIN_NS = 'deep-diving-skin'
/**
 * Slot key of this plugin's configuration page on the Plugins page:
 * `${package name}#${loader row id}`. Both are 'dsh-deep-diving-skin' because
 * cordis.patch.yml declares that row id.
 */
export const SKIN_ROW_CONFIG_KEY = 'dsh-deep-diving-skin#dsh-deep-diving-skin'

/** Longest accepted icon source; a base64 animated-GIF data URI is the realistic ceiling. */
export const ICON_MAX_CHARS = 2 * 1024 * 1024
/** Longest icon upload accepted from the settings page, before base64 expansion. */
export const UPLOAD_MAX_BYTES = 1024 * 1024
/** Longest accepted display text. */
export const TEXT_MAX_CHARS = 200
/** Longest accepted CSS color. */
export const COLOR_MAX_CHARS = 64
/** Rotation period bounds, in seconds. */
export const SPIN_SECONDS_MIN = 0.2
export const SPIN_SECONDS_MAX = 60

/** Everything the settings page can change. */
export interface SkinConfig {
  /** Icon source: the empty string selects the built-in taiji. */
  readonly icon: string
  /** Text replacing the localized "deep diving" phrase; the elapsed-time suffix is kept. */
  readonly text: string
  /** CSS color of the running-status line. */
  readonly color: string
  /** Whether the icon rotates. */
  readonly spin: boolean
  /** Seconds per full rotation. */
  readonly spinSeconds: number
}

/** The shipped preset: a spinning taiji + 「少女祈祷中」 + red. */
export const DEFAULT_SKIN: SkinConfig = {
  icon: '',
  text: '少女祈祷中',
  color: '#e60012',
  spin: true,
  spinSeconds: 3,
}

/**
 * Accepted icon sources: an inline image, an http(s) URL, or a root-relative
 * path. The allowlist is what keeps `javascript:` and friends out of the CSS
 * `url()` the patcher writes; the quote and control-character exclusions keep
 * that `url("…")` a well-formed string.
 */
const ICON_SCHEME = /^(?:data:image\/|https?:\/\/|\/)/
const ICON_REJECTED_CHARS = /["'\u0000-\u001f\u007f]/

/**
 * Whether a non-empty icon source may be used as a CSS image.
 * @param value - candidate icon source.
 * @returns true when the value is an accepted inline image, URL, or path.
 */
export function isIconSource(value: string): boolean {
  return value.length <= ICON_MAX_CHARS
    && ICON_SCHEME.test(value)
    && !ICON_REJECTED_CHARS.test(value)
}

/**
 * Whether a CSS color value is plausibly well-formed. Structural validity is
 * the browser's call (`CSS.supports`); this only bounds what reaches the wire
 * and the settings file.
 * @param value - candidate CSS color.
 * @returns true when the value is a short, control-character-free string.
 */
export function isColorValue(value: string): boolean {
  return value.length > 0 && value.length <= COLOR_MAX_CHARS && !/[\u0000-\u001f\u007f]/.test(value)
}

function recordOf(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

/**
 * Clamp a rotation period into the supported range.
 * @param value - candidate period in seconds.
 * @returns the clamped period, or the default when the value is not a number.
 */
export function clampSpinSeconds(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_SKIN.spinSeconds
  return Math.min(SPIN_SECONDS_MAX, Math.max(SPIN_SECONDS_MIN, value))
}

/**
 * Read any stored or received value as a complete configuration. Every field
 * falls back to its default independently, so a hand-edited or truncated
 * settings file degrades field by field instead of failing.
 * @param value - raw value from the settings file or the settings route.
 * @returns a well-formed configuration.
 */
export function normalizeSkinConfig(value: unknown): SkinConfig {
  const raw = recordOf(value)
  const icon = typeof raw.icon === 'string' && isIconSource(raw.icon) ? raw.icon : DEFAULT_SKIN.icon
  const text = typeof raw.text === 'string' && raw.text.length > 0 && raw.text.length <= TEXT_MAX_CHARS
    ? raw.text
    : DEFAULT_SKIN.text
  const color = typeof raw.color === 'string' && isColorValue(raw.color) ? raw.color : DEFAULT_SKIN.color
  return {
    icon,
    text,
    color,
    spin: typeof raw.spin === 'boolean' ? raw.spin : DEFAULT_SKIN.spin,
    spinSeconds: clampSpinSeconds(raw.spinSeconds),
  }
}

/**
 * Strict check behind a settings write. A write is rejected with a reason
 * instead of being silently coerced, so the settings page can tell the user
 * what is wrong with the value they just typed.
 * @param value - raw request body.
 * @returns the first problem found, or undefined when the body is writable.
 */
export function skinConfigProblem(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return 'expected a JSON object'
  const raw = value as Record<string, unknown>
  if (raw.icon !== undefined) {
    if (typeof raw.icon !== 'string') return 'icon must be a string'
    if (raw.icon !== '' && !isIconSource(raw.icon)) {
      return 'icon must be empty, a data:image/* URI, an http(s) URL, or a / path (and at most 2 MiB)'
    }
  }
  if (raw.text !== undefined) {
    if (typeof raw.text !== 'string' || raw.text.length === 0 || raw.text.length > TEXT_MAX_CHARS) {
      return `text must be a non-empty string of at most ${String(TEXT_MAX_CHARS)} characters`
    }
  }
  if (raw.color !== undefined && (typeof raw.color !== 'string' || !isColorValue(raw.color))) {
    return `color must be a non-empty CSS color of at most ${String(COLOR_MAX_CHARS)} characters`
  }
  if (raw.spin !== undefined && typeof raw.spin !== 'boolean') return 'spin must be a boolean'
  if (raw.spinSeconds !== undefined && (typeof raw.spinSeconds !== 'number' || !Number.isFinite(raw.spinSeconds))) {
    return 'spinSeconds must be a number'
  }
  return undefined
}
