/**
 * The running-status skin.
 *
 * DSH 0.2.x renders the running indicator inline in `ChatView` rather than
 * through a slot, and its copy belongs to a locale namespace another plugin
 * already owns (`LocaleRuntime.register` throws on an occupied (namespace,
 * locale)). A browser plugin therefore has exactly one lever: edit the
 * rendered element. This module owns that edit and nothing else.
 *
 * The markup it targets (verified against the shipped dsh 0.2.0-rc.1 bundle):
 *
 *   <div class="<hash>_running" data-chat-running>
 *     <span role="status" …>深度求索中...</span>          ← accessibility copy, left alone
 *     <span class="<hash>_runningDivider" …></span>
 *     <span class="<hash>_runningContent">
 *       <span class="<hash>_runningIcon"><svg …/></span>   ← the only <svg> inside
 *       <span class="<hash>_runningText" data-text-shimmer>深度求索中，用时 16分0秒...</span>
 *     </span>
 *   </div>
 *
 * Every step is a no-op when the markup is not what it expects, so a changed
 * DSH layout degrades to "the skin does nothing" rather than a broken page.
 */
import { resolveIconSource } from './art.ts'
import { DEFAULT_SKIN, type SkinConfig } from '../skin-config.ts'

/** The running-status element. */
export const RUNNING_SELECTOR = '[data-chat-running]'
/** The visible label, carrying the localization's full sentence. */
const TEXT_SELECTOR = '[data-text-shimmer]'
/** The visually hidden copy of the bare "deep diving" phrase. */
const STATUS_TEXT_SELECTOR = '[role="status"]'
/** Marks the icon node this plugin inserted. */
const ICON_ATTRIBUTE = 'data-dsh-deep-diving-skin-icon'
/** The one CSS custom property the running line takes its colour from. */
const COLOR_PROPERTY = '--dsw-alias-label-deep-diving'
/** Keyframes name injected by this plugin. */
const SPIN_KEYFRAMES = 'dsh-deep-diving-skin-spin'
/** Marks the stylesheet this plugin injected. */
const STYLE_ATTRIBUTE = 'data-dsh-deep-diving-skin-style'
/** Ellipsis and whitespace ending the bare phrase. */
const TRAILING_PUNCTUATION = /[.。…\s]+$/
/** Matches the built-in icon box so a replacement occupies the same slot. */
const ICON_SIZE = 'calc(14px + var(--dsh-content-font-delta, 0px))'

/** A read-only observable source: the shape the renderer's `hooks` compartment binds. */
export interface ObservableSource<T> {
  /** @returns the current value, by reference until it changes. */
  getSnapshot(): T
  /**
   * Observe value replacements.
   * @param listener - invoked after each change.
   * @returns the disposer removing this listener.
   */
  subscribe(listener: () => void): () => void
}

function ensureStyleTag(): HTMLStyleElement {
  const existing = document.head.querySelector<HTMLStyleElement>(`style[${STYLE_ATTRIBUTE}]`)
  if (existing !== null) return existing
  const style = document.createElement('style')
  style.setAttribute(STYLE_ATTRIBUTE, '')
  style.textContent = `@keyframes ${SPIN_KEYFRAMES} { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`
  document.head.append(style)
  return style
}

function iconNode(content: Element): HTMLElement {
  for (const child of content.children) {
    if (child.hasAttribute(ICON_ATTRIBUTE)) return child as HTMLElement
  }
  const icon = document.createElement('span')
  icon.setAttribute(ICON_ATTRIBUTE, '')
  icon.setAttribute('aria-hidden', 'true')
  // A bare span is inline, and width/height do not apply to it.
  icon.style.display = 'inline-block'
  icon.style.flex = 'none'
  icon.style.backgroundRepeat = 'no-repeat'
  icon.style.backgroundPosition = 'center'
  icon.style.backgroundSize = 'contain'
  content.prepend(icon)
  return icon
}

/**
 * Accept a configured colour only when the browser parses it, so a typo in the
 * settings file shows the shipped red instead of an unset colour.
 * @param value - configured CSS colour.
 * @returns the configured colour, or the shipped default.
 */
function usableColor(value: string): string {
  if (value.length === 0) return DEFAULT_SKIN.color
  const supported = typeof CSS !== 'undefined' && typeof CSS.supports === 'function'
    ? CSS.supports('color', value)
    : true
  return supported ? value : DEFAULT_SKIN.color
}

/**
 * Replace the bare phrase at the head of the visible label, keeping the
 * elapsed-time suffix the harness appends. React rewrites that text node on
 * every clock tick, so this is re-applied from the mutation observer.
 */
function patchText(
  text: Element,
  heading: string,
  replacement: string,
  written: Map<Element, { written: string; original: string; replacement: string }>,
): void {
  const onScreen = text.textContent ?? ''
  const previous = written.get(text)
  const ours = previous !== undefined && previous.written === onScreen
  if (ours && previous.replacement === replacement) return
  // Text the harness last wrote. While our own write still stands, the heading
  // is no longer on screen, so the previous record supplies it.
  const current = ours ? previous.original : onScreen
  if (heading === '' || !current.startsWith(heading)) return
  const desired = `${replacement}${current.slice(heading.length)}`
  if (desired === onScreen) return
  written.set(text, { written: desired, original: current, replacement })
  text.textContent = desired
}

/**
 * Start the skin: patch every running-status element now, on every
 * configuration change, and after every DOM mutation React commits.
 * @param source - the live configuration.
 * @returns the disposer that retracts every write.
 */
export function startSkin(source: ObservableSource<SkinConfig>): () => void {
  const style = ensureStyleTag()
  const hiddenSvgs = new Map<SVGElement, string>()
  const tinted = new Map<HTMLElement, string>()
  const written = new Map<Element, { written: string; original: string; replacement: string }>()
  // The exact source and animation already on a node. Reading them back would
  // compare against the CSSOM's own serialization instead of what was set.
  const iconStates = new WeakMap<Element, string>()
  let stopped = false
  let scheduled = false

  const apply = (): void => {
    const config = source.getSnapshot()
    const icon = resolveIconSource(config.icon)
    const color = usableColor(config.color)
    const animation = config.spin ? `${SPIN_KEYFRAMES} ${String(config.spinSeconds)}s linear infinite` : 'none'

    for (const element of document.querySelectorAll<HTMLElement>(RUNNING_SELECTOR)) {
      const text = element.querySelector(TEXT_SELECTOR)
      const content = text === null ? null : text.parentElement
      if (text === null || content === null) continue

      const svg = element.querySelector('svg')
      if (svg !== null) {
        if (!hiddenSvgs.has(svg)) hiddenSvgs.set(svg, svg.style.display)
        if (svg.style.display !== 'none') svg.style.display = 'none'
      }

      const node = iconNode(content)
      const appearance = `${icon}\u0000${animation}`
      if (iconStates.get(node) !== appearance) {
        iconStates.set(node, appearance)
        node.style.backgroundImage = `url("${icon}")`
        node.style.width = ICON_SIZE
        node.style.height = ICON_SIZE
        node.style.animation = animation
      }

      if (!tinted.has(element)) tinted.set(element, element.style.getPropertyValue(COLOR_PROPERTY))
      if (element.style.getPropertyValue(COLOR_PROPERTY) !== color) element.style.setProperty(COLOR_PROPERTY, color)

      const heading = (element.querySelector(STATUS_TEXT_SELECTOR)?.textContent ?? '').replace(TRAILING_PUNCTUATION, '')
      patchText(text, heading, config.text, written)
    }
  }

  // MutationObserver delivers one callback per mutation batch, so this guard
  // only folds a second batch that lands before the microtask runs. It also
  // terminates: a pass that changes nothing produces no further mutation.
  const schedule = (): void => {
    if (stopped || scheduled) return
    scheduled = true
    queueMicrotask(() => {
      scheduled = false
      if (!stopped) apply()
    })
  }

  const observer = new MutationObserver(schedule)
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true })
  const unsubscribe = source.subscribe(schedule)
  apply()

  return () => {
    stopped = true
    observer.disconnect()
    unsubscribe()
    for (const [svg, display] of hiddenSvgs) {
      if (svg.isConnected) svg.style.display = display
    }
    for (const [element, value] of tinted) {
      if (!element.isConnected) continue
      if (value === '') element.style.removeProperty(COLOR_PROPERTY)
      else element.style.setProperty(COLOR_PROPERTY, value)
    }
    for (const [text, entry] of written) {
      if (text.isConnected && text.textContent === entry.written) text.textContent = entry.original
    }
    for (const node of document.querySelectorAll(`[${ICON_ATTRIBUTE}]`)) node.remove()
    style.remove()
  }
}
