/**
 * The skin's configuration vocabulary. Imported by BOTH halves of the plugin,
 * so this module stays browser-safe: no Node import, no side effect.
 */
/** Host route serving the persisted configuration. */
export declare const SKIN_API_PATH = "/deep-diving-skin/api/config";
/** Route prefix the host half registers (loopback + same-origin fenced). */
export declare const SKIN_API_PREFIX = "/deep-diving-skin/api";
/** Locale namespace owned by this plugin. */
export declare const SKIN_NS = "deep-diving-skin";
/**
 * Slot key of this plugin's configuration page on the Plugins page:
 * `${package name}#${loader row id}`. Both are 'dsh-deep-diving-skin' because
 * cordis.patch.yml declares that row id.
 */
export declare const SKIN_ROW_CONFIG_KEY = "dsh-deep-diving-skin#dsh-deep-diving-skin";
/** Longest accepted icon source; a base64 animated-GIF data URI is the realistic ceiling. */
export declare const ICON_MAX_CHARS: number;
/** Longest icon upload accepted from the settings page, before base64 expansion. */
export declare const UPLOAD_MAX_BYTES: number;
/** Longest accepted display text. */
export declare const TEXT_MAX_CHARS = 200;
/** Longest accepted CSS color. */
export declare const COLOR_MAX_CHARS = 64;
/** Rotation directions, as the settings page offers them. */
export declare const SPIN_DIRECTIONS: readonly ["clockwise", "counterclockwise"];
/** Rotation period bounds, in seconds. */
export declare const SPIN_SECONDS_MIN = 0.2;
export declare const SPIN_SECONDS_MAX = 60;
/** Everything the settings page can change. */
export interface SkinConfig {
    /** Icon source: the empty string selects the bundled default icon. */
    readonly icon: string;
    /** Text replacing the localized "deep diving" phrase; the elapsed-time suffix is kept. */
    readonly text: string;
    /** CSS color of the running-status line. */
    readonly color: string;
    /** CSS color of the sweep that crosses the text. Deliberately independent of {@link color}. */
    readonly shimmerColor: string;
    /** Whether the icon rotates. */
    readonly spin: boolean;
    /** Seconds per full rotation. */
    readonly spinSeconds: number;
    /** Which way the icon turns. */
    readonly spinDirection: SpinDirection;
}
/** One of {@link SPIN_DIRECTIONS}. */
export type SpinDirection = (typeof SPIN_DIRECTIONS)[number];
/** Every stored field, for code that has to compare a write with its answer. */
export declare const SKIN_FIELDS: readonly ["icon", "text", "color", "shimmerColor", "spin", "spinSeconds", "spinDirection"];
/** The shipped defaults. */
export declare const DEFAULT_SKIN: SkinConfig;
/**
 * Whether a non-empty icon source may be used as a CSS image.
 * @param value - candidate icon source.
 * @returns true when the value is an accepted inline image, URL, or path.
 */
export declare function isIconSource(value: string): boolean;
/**
 * Whether a CSS color value is plausibly well-formed. Structural validity is
 * the browser's call (`CSS.supports`); this only bounds what reaches the wire
 * and the settings file.
 * @param value - candidate CSS color.
 * @returns true when the value is a short, control-character-free string.
 */
export declare function isColorValue(value: string): boolean;
/**
 * Clamp a rotation period into the supported range.
 * @param value - candidate period in seconds.
 * @returns the clamped period, or the default when the value is not a number.
 */
export declare function clampSpinSeconds(value: unknown): number;
/**
 * Read any stored or received value as a complete configuration. Every field
 * falls back to its default independently, so a hand-edited or truncated
 * settings file degrades field by field instead of failing.
 * @param value - raw value from the settings file or the settings route.
 * @returns a well-formed configuration.
 */
export declare function normalizeSkinConfig(value: unknown): SkinConfig;
/**
 * Strict check behind a settings write. A write is rejected with a reason
 * instead of being silently coerced, so the settings page can tell the user
 * what is wrong with the value they just typed.
 * @param value - raw request body.
 * @returns the first problem found, or undefined when the body is writable.
 */
export declare function skinConfigProblem(value: unknown): string | undefined;
