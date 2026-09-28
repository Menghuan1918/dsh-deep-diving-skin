/**
 * The default icon: a yin-yang as a self-contained SVG data URI.
 * Geometry (viewBox 0 0 100 100):
 *
 * - outer disc r=49, white with a dark rim;
 * - the filled half is bounded by the outer circle's LEFT arc from (50,1) to
 *   (50,99) and returns through two half-radius circles — the lower one
 *   (r=24.5, centre (50,74.5)) bulging right, the upper one (centre
 *   (50,25.5)) bulging left, which is the classic S;
 * - each lobe carries its counter-coloured eye at its circle's centre.
 */
/** The default icon markup. Kept as markup so the data URI is generated safely. */
export declare const DEFAULT_ICON_SVG: string;
/**
 * Percent-encode SVG markup into a data URI. `encodeURIComponent` leaves
 * parentheses and apostrophes alone, and those would end the CSS `url("…")`
 * string early, so they are escaped too.
 * @param svg - SVG markup.
 * @returns a `data:image/svg+xml,…` URI.
 */
export declare function svgDataUri(svg: string): string;
/** The bundled default icon source. */
export declare const DEFAULT_ICON_URI: string;
/**
 * Resolve the configured icon source.
 * @param icon - configured icon; the empty string selects the bundled default.
 * @returns a CSS-usable image source.
 */
export declare function resolveIconSource(icon: string): string;
