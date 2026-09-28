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
export const STYLE_ATTRIBUTE = 'data-dsh-deep-diving-skin-style'

const CSS = `
.dds-page { display: flex; flex-direction: column; gap: 12px; max-width: 640px; }
.dds-card {
  display: flex; flex-direction: column; gap: 10px; padding: 14px 16px;
  background: var(--dsw-alias-settings-card-fill);
  border: 0.5px solid var(--dsw-alias-settings-card-stroke);
  border-radius: var(--dsw-radius-xl);
}
.dds-card-title { font: var(--dsw-font-s-strong-14); color: var(--dsw-alias-label-primary); }
.dds-field { display: flex; flex-direction: column; gap: 4px; }
.dds-label { font: var(--dsw-font-xs-strong-13); color: var(--dsw-alias-label-primary); }
.dds-hint { margin: 0; font: var(--dsw-font-xxs-12); color: var(--dsw-alias-label-tertiary); }
.dds-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dds-input {
  box-sizing: border-box; width: 100%; padding: 6px 10px;
  font: var(--dsw-font-s-14); color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-bg-layer-1);
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
}
.dds-input::placeholder { color: var(--dsw-alias-label-caption); }
.dds-input:focus-visible {
  outline: 2px solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 1px;
}
.dds-input-number { width: 96px; }
.dds-color {
  width: 44px; height: 32px; padding: 2px; flex: none; cursor: pointer;
  background: var(--dsw-alias-bg-layer-1);
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
}
.dds-preview {
  display: inline-flex; align-items: center; justify-content: center; flex: none;
  width: 36px; height: 36px; overflow: hidden;
  background: var(--dsw-alias-bg-layer-2);
  border-radius: var(--dsw-radius-md);
}
.dds-preview-image { width: 26px; height: 26px; object-fit: contain; }
.dds-picker { font: var(--dsw-font-xs-13); color: var(--dsw-alias-label-secondary); }
.dds-button {
  font: var(--dsw-font-xs-strong-13); padding: 5px 12px; cursor: pointer;
  color: var(--dsw-alias-label-primary); background: transparent;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
}
.dds-button:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
.dds-button:focus-visible {
  outline: 2px solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 1px;
}
.dds-button:disabled { opacity: 0.5; cursor: default; }
.dds-button-primary {
  color: var(--dsw-alias-label-primary-foreground);
  background: var(--dsw-alias-button-primary-fill);
  border-color: transparent;
}
.dds-button-primary:hover:not(:disabled) { background: var(--dsw-alias-button-primary-hover); }
.dds-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dds-status { font: var(--dsw-font-xxs-12); }
.dds-status-ok { color: var(--dsw-alias-state-success-primary); }
.dds-status-error { color: var(--dsw-alias-state-error-primary); }
`

/**
 * Install the stylesheet once.
 * @returns the disposer removing the tag this call owns, or nothing when one already existed.
 */
export function installStyles(): () => void {
  if (document.head.querySelector(`style[${STYLE_ATTRIBUTE}]`) !== null) return () => {}
  const tag = document.createElement('style')
  tag.setAttribute(STYLE_ATTRIBUTE, '')
  tag.textContent = CSS
  document.head.append(tag)
  return () => { tag.remove() }
}
