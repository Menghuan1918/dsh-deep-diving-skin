// @vitest-environment jsdom
/**
 * The skin against the markup the running GUI actually renders. The fixture is
 * a copy of a real `[data-chat-running]` element: the whale `<svg>`, and the
 * `TextShimmer` subtree whose label exists TWICE — as the visible leaf's text
 * and as the `data-shimmer-text` attribute the highlight paints with
 * `content: attr(data-shimmer-text)`.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_ICON_URI } from '../src/client/art.ts'
import { startSkin, type ObservableSource } from '../src/client/patcher.ts'
import { DEFAULT_SKIN, type SkinConfig } from '../src/skin-config.ts'

const ICON_ATTRIBUTE = 'data-dsh-deep-diving-skin-icon'
const COLOR_PROPERTY = '--dsw-alias-label-deep-diving'
const SHIMMER_COLOR_PROPERTY = '--dsw-alias-label-shimmer'
const SHIMMER_TEXT_ATTRIBUTE = 'data-shimmer-text'

const WHALE_PATH = 'M8.844 13.742C8.967 12.328 8.45 10.4 8.45 9.65C8.45 8.94 8.88 8.43 9.6 8.43Z'

/** Markup of the running-status line, as the running build emits it. */
function runningMarkup(label: string, status = '深度求索中...'): string {
  return [
    '<div class="EvIC1a_running" data-chat-running="true">',
    `<span class="TTCZqG_visuallyHidden" role="status" aria-live="polite" aria-atomic="true">${status}</span>`,
    '<span class="EvIC1a_runningDivider" aria-hidden="true"></span>',
    '<span class="EvIC1a_runningContent">',
    '<span class="EvIC1a_runningIcon" aria-hidden="true">',
    `<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none"><path class="EvIC1a_runningWhaleAnimated" d="${WHALE_PATH}" stroke="currentColor" stroke-width="1"><animate attributeName="d" values="${WHALE_PATH}" dur="3s" repeatCount="indefinite"></animate></path><path class="EvIC1a_runningWhaleStill" d="${WHALE_PATH}" stroke="currentColor" stroke-width="1"></path></svg>`,
    '</span>',
    '<span class="_root_1rdzk_1 EvIC1a_runningText" data-shimmer="true">',
    `<span class="_content_1rdzk_11"><span class="_text_1rdzk_17">${label}</span></span>`,
    '<span class="_decoration_1rdzk_25" aria-hidden="true" inert="">',
    '<span class="_sweep_1rdzk_34">',
    `<span class="_content_1rdzk_11 _highlight_1rdzk_54"><span class="_text_1rdzk_17" ${SHIMMER_TEXT_ATTRIBUTE}="${label}"></span></span>`,
    '</span>',
    '</span>',
    '</span>',
    '</span>',
    '</div>',
  ].join('')
}

/**
 * Disposers started by a test, so a failing assertion cannot leave an observer
 * watching the next test's fixture.
 */
const live = new Set<() => void>()

/** Start the skin and make the test's cleanup unconditional. */
function start(source: ObservableSource<SkinConfig>): () => void {
  const release = startSkin(source)
  const tracked = (): void => {
    live.delete(tracked)
    release()
  }
  live.add(tracked)
  return tracked
}

/** A stand-in for the store's observable source. */
function sourceOf(initial: SkinConfig): { source: ObservableSource<SkinConfig>; publish(next: SkinConfig): void } {
  let snapshot = initial
  const listeners = new Set<() => void>()
  return {
    source: {
      getSnapshot: () => snapshot,
      subscribe: (listener) => {
        listeners.add(listener)
        return () => { listeners.delete(listener) }
      },
    },
    publish(next: SkinConfig): void {
      snapshot = next
      for (const listener of [...listeners]) listener()
    },
  }
}

/** Drain the microtask-scheduled pass the mutation observer requests. */
async function settle(): Promise<void> {
  await new Promise<void>((resolve) => { setTimeout(resolve, 0) })
}

function runningElement(): HTMLElement {
  const element = document.querySelector<HTMLElement>('[data-chat-running]')
  if (element === null) throw new Error('fixture is missing the running-status element')
  return element
}

function iconElement(): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[${ICON_ATTRIBUTE}]`)
}

/** The visible label leaf, found the same way the patcher finds it. */
function visibleLabel(): HTMLElement {
  const found = [...runningElement().querySelectorAll<HTMLElement>('span')].find(
    node => node.childElementCount === 0
      && node.textContent !== ''
      // The screen-reader copy is a leaf with text too; the visible label is not it.
      && node.getAttribute('role') !== 'status'
      && !node.hasAttribute(SHIMMER_TEXT_ATTRIBUTE),
  )
  if (found === undefined) throw new Error('fixture is missing the visible label')
  return found
}

/** The highlight copy, which paints from its attribute. */
function highlightLabel(): HTMLElement {
  const found = runningElement().querySelector<HTMLElement>(`[${SHIMMER_TEXT_ATTRIBUTE}]`)
  if (found === null) throw new Error('fixture is missing the highlight label')
  return found
}

beforeEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = runningMarkup('深度求索中，用时 16分0秒...')
})

afterEach(() => {
  for (const dispose of [...live]) dispose()
})

describe('running-status skin', () => {
  it('replaces the icon, both label copies and the colour', () => {
    const dispose = start(sourceOf({ ...DEFAULT_SKIN }).source)

    const icon = iconElement()
    expect(icon).not.toBeNull()
    expect(icon!.style.backgroundImage).toBe(`url(${DEFAULT_ICON_URI})`)
    expect(icon!.style.animation).toContain('3s')
    expect(icon!.getAttribute('aria-hidden')).toBe('true')
    expect(icon!.parentElement?.firstElementChild).toBe(icon)

    // The built-in icon box is hidden, glyph and all.
    expect(document.querySelector<HTMLElement>('.EvIC1a_runningIcon')!.style.display).toBe('none')

    expect(visibleLabel().textContent).toBe('少女祈祷中，用时 16分0秒...')
    expect(highlightLabel().getAttribute(SHIMMER_TEXT_ATTRIBUTE)).toBe('少女祈祷中，用时 16分0秒...')
    // The screen-reader copy stays the harness's own wording.
    expect(document.querySelector('[role="status"]')!.textContent).toBe('深度求索中...')
    expect(runningElement().style.getPropertyValue(COLOR_PROPERTY)).toBe('#e60012')
    // The sweep is its own colour: a tint of the text would be invisible, and
    // the theme's shimmer blue clashes with red.
    expect(runningElement().style.getPropertyValue(SHIMMER_COLOR_PROPERTY)).toBe('#ffffff')
    expect(icon!.style.animation).not.toContain('reverse')

    dispose()
  })

  it('honours a custom icon, text, colour and rotation', () => {
    const custom: SkinConfig = {
      icon: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
      text: '祈祷中',
      color: '#3366ff',
      shimmerColor: '#ffd400',
      spin: true,
      spinSeconds: 1,
      spinDirection: 'counterclockwise',
    }
    const dispose = start(sourceOf(custom).source)

    expect(iconElement()!.style.backgroundImage).toBe(`url(${custom.icon})`)
    // One keyframes sheet covers both directions via the animation shorthand.
    expect(iconElement()!.style.animation).toContain('reverse')
    expect(visibleLabel().textContent).toBe('祈祷中，用时 16分0秒...')
    expect(highlightLabel().getAttribute(SHIMMER_TEXT_ATTRIBUTE)).toBe('祈祷中，用时 16分0秒...')
    expect(runningElement().style.getPropertyValue(COLOR_PROPERTY)).toBe('#3366ff')
    expect(runningElement().style.getPropertyValue(SHIMMER_COLOR_PROPERTY)).toBe('#ffd400')

    dispose()
  })

  it('re-applies after React rewrites the label on a clock tick', async () => {
    const dispose = start(sourceOf({ ...DEFAULT_SKIN }).source)
    expect(visibleLabel().textContent).toBe('少女祈祷中，用时 16分0秒...')

    // React's next tick: fresh text on one copy, fresh attribute on the other.
    visibleLabel().textContent = '深度求索中，用时 16分1秒...'
    highlightLabel().setAttribute(SHIMMER_TEXT_ATTRIBUTE, '深度求索中，用时 16分1秒...')
    await settle()

    expect(visibleLabel().textContent).toBe('少女祈祷中，用时 16分1秒...')
    expect(highlightLabel().getAttribute(SHIMMER_TEXT_ATTRIBUTE)).toBe('少女祈祷中，用时 16分1秒...')
    dispose()
  })

  it('restores its icon node after the subtree is rebuilt', async () => {
    const dispose = start(sourceOf({ ...DEFAULT_SKIN }).source)
    iconElement()!.remove()
    expect(iconElement()).toBeNull()

    await settle()

    expect(iconElement()).not.toBeNull()
    dispose()
  })

  it('reacts to a configuration change without a page reload', async () => {
    const { source, publish } = sourceOf({ ...DEFAULT_SKIN })
    const dispose = start(source)

    // A configuration change rides the same coalesced pass as a DOM mutation.
    publish({ ...DEFAULT_SKIN, text: '少女祈祷中！', color: 'red' })
    await settle()

    expect(visibleLabel().textContent).toBe('少女祈祷中！，用时 16分0秒...')
    expect(highlightLabel().getAttribute(SHIMMER_TEXT_ATTRIBUTE)).toBe('少女祈祷中！，用时 16分0秒...')
    expect(runningElement().style.getPropertyValue(COLOR_PROPERTY)).toBe('red')
    dispose()
  })

  it('stays idempotent across repeated passes', async () => {
    const dispose = start(sourceOf({ ...DEFAULT_SKIN }).source)
    await settle()
    await settle()

    expect(document.querySelectorAll(`[${ICON_ATTRIBUTE}]`)).toHaveLength(1)
    expect(document.querySelectorAll('style[data-dsh-deep-diving-skin-spin]')).toHaveLength(1)
    expect(visibleLabel().textContent).toBe('少女祈祷中，用时 16分0秒...')
    expect(highlightLabel().getAttribute(SHIMMER_TEXT_ATTRIBUTE)).toBe('少女祈祷中，用时 16分0秒...')
    dispose()
  })

  it('leaves an unrecognised label alone', () => {
    document.body.innerHTML = runningMarkup('完全不同的一句话', '深度求索中...')
    const dispose = start(sourceOf({ ...DEFAULT_SKIN }).source)

    expect(visibleLabel().textContent).toBe('完全不同的一句话')
    expect(highlightLabel().getAttribute(SHIMMER_TEXT_ATTRIBUTE)).toBe('完全不同的一句话')
    dispose()
  })

  it('does nothing when the markup is not the expected one', () => {
    document.body.innerHTML = '<div data-chat-running><span>no shimmer here</span></div>'
    const dispose = start(sourceOf({ ...DEFAULT_SKIN }).source)

    expect(iconElement()).toBeNull()
    expect(document.body.textContent).toBe('no shimmer here')
    dispose()
  })

  it('retracts every write on dispose', () => {
    const dispose = start(sourceOf({ ...DEFAULT_SKIN }).source)
    expect(iconElement()).not.toBeNull()
    const original = '深度求索中，用时 16分0秒...'

    dispose()

    expect(iconElement()).toBeNull()
    expect(document.querySelector('style[data-dsh-deep-diving-skin-spin]')).toBeNull()
    expect(document.querySelector<HTMLElement>('.EvIC1a_runningIcon')!.style.display).toBe('')
    expect(runningElement().style.getPropertyValue(COLOR_PROPERTY)).toBe('')
    expect(runningElement().style.getPropertyValue(SHIMMER_COLOR_PROPERTY)).toBe('')
    expect(visibleLabel().textContent).toBe(original)
    expect(highlightLabel().getAttribute(SHIMMER_TEXT_ATTRIBUTE)).toBe(original)
  })

  it('patches every running-status line on the page', () => {
    document.body.innerHTML = `${runningMarkup('深度求索中，用时 1分0秒...')}${runningMarkup('深度求索中...', '深度求索中...')}`
    const dispose = start(sourceOf({ ...DEFAULT_SKIN }).source)

    expect(document.querySelectorAll(`[${ICON_ATTRIBUTE}]`)).toHaveLength(2)
    expect([...document.querySelectorAll<HTMLElement>(`[${SHIMMER_TEXT_ATTRIBUTE}]`)]
      .map(node => node.getAttribute(SHIMMER_TEXT_ATTRIBUTE)))
      .toEqual(['少女祈祷中，用时 1分0秒...', '少女祈祷中...'])
    dispose()
  })
})
