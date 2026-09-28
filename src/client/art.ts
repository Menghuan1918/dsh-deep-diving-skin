/**
 * The default icon: the Touhou loading-screen taiji, as a self-contained SVG
 * data URI. Geometry (viewBox 0 0 100 100):
 *
 * - outer disc r=49, white with a dark rim;
 * - the filled half is bounded by the outer circle's LEFT arc from (50,1) to
 *   (50,99) and returns through two half-radius circles — the lower one
 *   (r=24.5, centre (50,74.5)) bulging right, the upper one (centre
 *   (50,25.5)) bulging left, which is the classic S;
 * - each lobe carries its counter-coloured eye at its circle's centre.
 */

/** The default taiji markup. Kept as markup so the data URI is generated safely. */
export const DEFAULT_ICON_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">',
  '<circle cx="50" cy="50" r="49" fill="#ffffff" stroke="#111111" stroke-width="2"/>',
  '<path d="M50 1A49 49 0 0 0 50 99A24.5 24.5 0 0 0 50 50A24.5 24.5 0 0 1 50 1Z" fill="#e60012"/>',
  '<circle cx="50" cy="25.5" r="8" fill="#e60012"/>',
  '<circle cx="50" cy="74.5" r="8" fill="#ffffff"/>',
  '</svg>',
].join('')

/**
 * Percent-encode SVG markup into a data URI. `encodeURIComponent` leaves
 * parentheses and apostrophes alone, and those would end the CSS `url("…")`
 * string early, so they are escaped too.
 * @param svg - SVG markup.
 * @returns a `data:image/svg+xml,…` URI.
 */
export function svgDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/'/g, '%27')}`
}

/** The bundled default icon source. */
export const DEFAULT_ICON_URI = svgDataUri(DEFAULT_ICON_SVG)

/**
 * Resolve the configured icon source.
 * @param icon - configured icon; the empty string selects the bundled default.
 * @returns a CSS-usable image source.
 */
export function resolveIconSource(icon: string): string {
  return icon === '' ? DEFAULT_ICON_URI : icon
}
