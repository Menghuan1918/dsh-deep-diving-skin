/**
 * The running-status skin.
 *
 * DSH renders the running indicator inline in `ChatView` rather than through a
 * slot, and its copy belongs to a locale namespace another plugin already owns
 * (`LocaleRuntime.register` throws on an occupied (namespace, locale)). A
 * browser plugin therefore has exactly one lever: edit the rendered element.
 * This module owns that edit and nothing else.
 *
 * The element it targets, as the running build renders it:
 *
 *   <div data-chat-running>
 *     <span role="status" …>深度求索中...</span>            ← the bare phrase, read (never written)
 *     <span class="…_runningDivider" …></span>
 *     <span class="…_runningContent">
 *       <span class="…_runningIcon"><svg …/></span>          ← hidden while the skin is on
 *       <span class="…_runningText" data-shimmer>            ← the shimmer root
 *         <span class="…_content"><span class="…_text">深度求索中，用时 2分24秒...</span></span>
 *         <span class="…_decoration"><span class="…_sweep"><span class="…_content …_highlight">
 *           <span class="…_text" data-shimmer-text="深度求索中，用时 2分24秒..."></span>
 *
 * The label exists twice: once as the visible span's text, and once as the
 * `data-shimmer-text` attribute of the highlight copy, which CSS paints with
 * `content: attr(data-shimmer-text)`. Both are rewritten, so the sweep cannot
 * draw the old phrase over the new one.
 *
 * Every step is a no-op when the markup is not what it expects, so a changed
 * layout degrades to "the skin does nothing" rather than a broken page.
 */
import { resolveIconSource } from './art.ts'
import { DEFAULT_SKIN, type SkinConfig } from '../skin-config.ts'

/** The running-status element. */
export const RUNNING_SELECTOR = '[data-chat-running]'
/** The shimmer root: its parent is the row holding the icon and the label. */
const SHIMMER_SELECTOR = '[data-shimmer]'
/** The attribute the highlight copy paints its text from. */
const SHIMMER_TEXT_ATTRIBUTE = 'data-shimmer-text'
/** The visually hidden copy of the bare "deep diving" phrase. */
const STATUS_TEXT_SELECTOR = '[role="status"]'
/** Marks the icon node this plugin inserted. */
const ICON_ATTRIBUTE = 'data-dsh-deep-diving-skin-icon'
/** The CSS custom property the running line takes its colour from. */
const COLOR_PROPERTY = '--dsw-alias-label-deep-diving'
/** The CSS custom property the sweep band paints with. */
const SHIMMER_COLOR_PROPERTY = '--dsw-alias-label-shimmer'
/** Keyframes name injected by this plugin. */
const SPIN_KEYFRAMES = 'dsh-deep-diving-skin-spin'
/**
 * Marks the keyframes sheet this plugin injected. Deliberately NOT the
 * attribute `styles.ts` uses for the page stylesheet: two owners sharing one
 * attribute is how the keyframes silently went missing once already.
 */
const STYLE_ATTRIBUTE = 'data-dsh-deep-diving-skin-spin'
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

/** One value this plugin wrote, and what it replaced. */
interface Written {
  readonly written: string
  readonly original: string
  readonly replacement: string
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
 * The row holding the built-in icon and the label: the nearest ancestor of the
 * icon that is a direct child of the running element, else the shimmer root's
 * parent.
 * @param element - running-status element.
 * @param svg - the built-in icon glyph, when present.
 * @returns the row to insert the replacement icon into.
 */
function contentRow(element: Element, svg: SVGElement | null): Element | null {
  if (svg !== null) {
    let node: Element | null = svg.parentElement
    while (node !== null && node.parentElement !== element) node = node.parentElement
    if (node !== null) return node
  }
  const shimmer = element.querySelector(SHIMMER_SELECTOR)
  return shimmer === null ? null : shimmer.parentElement
}

/**
 * Accept a configured colour only when the browser parses it, so a typo in the
 * settings file shows the default instead of an unset colour.
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
 * Replace the bare phrase at the head of one string, keeping the elapsed-time
 * suffix. React rewrites both copies on every clock tick, so this is re-applied
 * from the mutation observer.
 * @param node - element the value belongs to.
 * @param heading - localized phrase to replace, as the harness wrote it.
 * @param replacement - configured text.
 * @param read - read the current value.
 * @param write - write a replaced value.
 * @param written - records of this plugin's own writes, for idempotence and restore.
 */
function patchSlot(
  node: Element,
  heading: string,
  replacement: string,
  read: () => string,
  write: (next: string) => void,
  written: Map<Element, Written>,
): void {
  const onScreen = read()
  const previous = written.get(node)
  const ours = previous !== undefined && previous.written === onScreen
  if (ours && previous.replacement === replacement) return
  // The string the harness last wrote. While our own write still stands, the
  // heading is no longer on screen, so the previous record supplies it.
  const current = ours ? previous.original : onScreen
  if (heading === '' || !current.startsWith(heading)) return
  const desired = `${replacement}${current.slice(heading.length)}`
  if (desired === onScreen) return
  written.set(node, { written: desired, original: current, replacement })
  write(desired)
}

/**
 * Start the skin: patch every running-status element now, on every
 * configuration change, and after every DOM mutation React commits.
 * @param source - the live configuration.
 * @returns the disposer that retracts every write.
 */
export function startSkin(source: ObservableSource<SkinConfig>): () => void {
  const style = ensureStyleTag()
  const hidden = new Map<HTMLElement | SVGElement, string>()
  const tinted = new Map<HTMLElement, { color: string; shimmer: string }>()
  const writtenText = new Map<Element, Written>()
  const writtenAttribute = new Map<Element, Written>()
  // The exact source and animation already on a node. Reading them back would
  // compare against the CSSOM's own serialization instead of what was set.
  const iconStates = new WeakMap<Element, string>()
  let stopped = false
  let scheduled = false

  const apply = (): void => {
    const config = source.getSnapshot()
    const icon = resolveIconSource(config.icon)
    const color = usableColor(config.color)
    const shimmer = usableColor(config.shimmerColor)
    // `reverse` plays the same keyframes backwards, so one sheet covers both
    // directions.
    const direction = config.spinDirection === 'counterclockwise' ? ' reverse' : ''
    const animation = config.spin
      ? `${SPIN_KEYFRAMES} ${String(config.spinSeconds)}s linear infinite${direction}`
      : 'none'

    for (const element of document.querySelectorAll<HTMLElement>(RUNNING_SELECTOR)) {
      const svg = element.querySelector('svg')
      const content = contentRow(element, svg)
      if (content === null) continue

      if (svg !== null) {
        // Hide the whole built-in icon box, not just the glyph: the box keeps
        // its width, which would otherwise leave a gap before the replacement.
        const box: HTMLElement | SVGElement = svg.parentElement ?? svg
        const target: HTMLElement | SVGElement = box === content ? svg : box
        if (!hidden.has(target)) hidden.set(target, target.style.display)
        if (target.style.display !== 'none') target.style.display = 'none'
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

      // Both colours are painted from custom properties on this one element, so
      // scope them here rather than restyling anything the theme owns.
      let original = tinted.get(element)
      if (original === undefined) {
        original = {
          color: element.style.getPropertyValue(COLOR_PROPERTY),
          shimmer: element.style.getPropertyValue(SHIMMER_COLOR_PROPERTY),
        }
        tinted.set(element, original)
      }
      if (element.style.getPropertyValue(COLOR_PROPERTY) !== color) element.style.setProperty(COLOR_PROPERTY, color)
      if (element.style.getPropertyValue(SHIMMER_COLOR_PROPERTY) !== shimmer) {
        element.style.setProperty(SHIMMER_COLOR_PROPERTY, shimmer)
      }

      const status = element.querySelector(STATUS_TEXT_SELECTOR)
      const heading = (status?.textContent ?? '').replace(TRAILING_PUNCTUATION, '')
      // Both label copies, wherever the build puts them: a leaf element's text,
      // and the attribute the highlight paints from. The screen-reader copy is
      // skipped explicitly: it holds the same phrase and must stay untouched.
      for (const target of [element, ...element.querySelectorAll('*')]) {
        if (target === status || target.closest(STATUS_TEXT_SELECTOR) !== null) continue
        if (target.childElementCount === 0) {
          patchSlot(
            target,
            heading,
            config.text,
            () => target.textContent ?? '',
            (next) => { target.textContent = next },
            writtenText,
          )
        }
        if (target.hasAttribute(SHIMMER_TEXT_ATTRIBUTE)) {
          patchSlot(
            target,
            heading,
            config.text,
            () => target.getAttribute(SHIMMER_TEXT_ATTRIBUTE) ?? '',
            (next) => { target.setAttribute(SHIMMER_TEXT_ATTRIBUTE, next) },
            writtenAttribute,
          )
        }
      }
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
    for (const [target, display] of hidden) {
      if (target.isConnected) target.style.display = display
    }
    for (const [element, value] of tinted) {
      if (!element.isConnected) continue
      if (value.color === '') element.style.removeProperty(COLOR_PROPERTY)
      else element.style.setProperty(COLOR_PROPERTY, value.color)
      if (value.shimmer === '') element.style.removeProperty(SHIMMER_COLOR_PROPERTY)
      else element.style.setProperty(SHIMMER_COLOR_PROPERTY, value.shimmer)
    }
    for (const [target, entry] of writtenText) {
      if (target.isConnected && target.textContent === entry.written) target.textContent = entry.original
    }
    for (const [target, entry] of writtenAttribute) {
      if (target.isConnected && target.getAttribute(SHIMMER_TEXT_ATTRIBUTE) === entry.written) {
        target.setAttribute(SHIMMER_TEXT_ATTRIBUTE, entry.original)
      }
    }
    for (const node of document.querySelectorAll(`[${ICON_ATTRIBUTE}]`)) node.remove()
    style.remove()
  }
}
