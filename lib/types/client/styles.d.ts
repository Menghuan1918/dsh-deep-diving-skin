/**
 * The settings page's stylesheet, injected as one `<style>` tag at plugin
 * activation. Every value is a DSH semantic token, so the page follows the
 * active light/dark theme and any user token overrides without a second
 * definition. Class names are prefixed `dds-` and live nowhere else.
 *
 * Token pairings (fill/foreground, card fill/stroke, focus ring) are copied
 * from the shipped components that already use them, so this page cannot drift
 * from the rest of the settings surface.
 */
/** Marks the injected stylesheet; also the removal handle. */
export declare const STYLE_ATTRIBUTE = "data-dsh-deep-diving-skin-style";
/**
 * Install the stylesheet once.
 * @returns the disposer removing the tag this call owns, or nothing when one already existed.
 */
export declare function installStyles(): () => void;
