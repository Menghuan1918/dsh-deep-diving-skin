// @vitest-environment jsdom
/**
 * The skin against the markup the running dsh 0.2.0-rc.1 bundle renders. The
 * fixture is a verbatim structural copy of
 * `@deepseek-ai/dsh-client-ui-chat`'s `RunningStatus` output, including the
 * hashed CSS-Module class names (`<hash>_<local>`).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_ICON_URI } from '../src/client/art.ts'
import { startSkin, type ObservableSource } from '../src/client/patcher.ts'
import { DEFAULT_SKIN, type SkinConfig } from '../src/skin-config.ts'

const ICON_ATTRIBUTE = 'data-dsh-deep-diving-skin-icon'
const COLOR_PROPERTY = '--dsw-alias-label-deep-diving'

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

/** Markup of the running-status line, as the shipped client renders it. */
function runningMarkup(label: string, status = '深度求索中...'): string {
  return [
    '<div class="EvIC1a_running" data-chat-running>',
    `<span class="a11y_visuallyHidden" role="status" aria-live="polite" aria-atomic="true">${status}</span>`,
    '<span class="EvIC1a_runningDivider" aria-hidden="true"></span>',
    '<span class="EvIC1a_runningContent">',
    '<span class="EvIC1a_runningIcon" aria-hidden="true"><svg width="100%" height="100%" viewBox="0 0 16 16" fill="none"><path d="M8.844 13.742" stroke="currentColor" stroke-width="1"/></svg></span>',
    `<span class="EvIC1a_runningText" data-text-shimmer="true">${label}</span>`,
    '</span>',
    '</div>',
  ].join('')
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

function labelElement(): HTMLElement {
  return document.querySelector<HTMLElement>('[data-text-shimmer]')!
}

beforeEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = runningMarkup('深度求索中，用时 16分0秒...')
})

afterEach(() => {
  for (const dispose of [...live]) dispose()
})

describe('running-status skin', () => {
  it('applies the shipped preset over the built-in whale and copy', () => {
    const { source } = sourceOf({ ...DEFAULT_SKIN })
    const dispose = start(source)

    const icon = iconElement()
    expect(icon).not.toBeNull()
    expect(icon!.style.backgroundImage).toBe(`url(${DEFAULT_ICON_URI})`)
    expect(icon!.style.animation).toContain('3s')
    expect(icon!.getAttribute('aria-hidden')).toBe('true')
    // The replacement heads the flex row, where the built-in icon sat.
    expect(icon!.parentElement?.querySelector('svg')).not.toBeNull()
    expect(icon!.parentElement?.firstElementChild).toBe(icon)

    expect(document.querySelector('svg')!.style.display).toBe('none')
    expect(labelElement().textContent).toBe('少女祈祷中，用时 16分0秒...')
    // The screen-reader copy stays the harness's own wording.
    expect(document.querySelector('[role="status"]')!.textContent).toBe('深度求索中...')
    expect(runningElement().style.getPropertyValue(COLOR_PROPERTY)).toBe('#e60012')

    dispose()
  })

  it('honours a custom icon, text, colour and rotation', () => {
    const custom: SkinConfig = {
      icon: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
      text: '祈祷中',
      color: '#3366ff',
      spin: false,
      spinSeconds: 1,
    }
    const dispose = start(sourceOf(custom).source)

    expect(iconElement()!.style.backgroundImage).toBe(`url(${custom.icon})`)
    expect(iconElement()!.style.animation).toBe('none')
    expect(labelElement().textContent).toBe('祈祷中，用时 16分0秒...')
    expect(runningElement().style.getPropertyValue(COLOR_PROPERTY)).toBe('#3366ff')

    dispose()
  })

  it('re-applies after React rewrites the label on a clock tick', async () => {
    const dispose = start(sourceOf({ ...DEFAULT_SKIN }).source)
    expect(labelElement().textContent).toBe('少女祈祷中，用时 16分0秒...')

    // React's next tick: setTextContent with the freshly localized label.
    labelElement().textContent = '深度求索中，用时 16分1秒...'
    await settle()

    expect(labelElement().textContent).toBe('少女祈祷中，用时 16分1秒...')
    dispose()
  })

  it('restores its icon node after the subtree is rebuilt', async () => {
    const dispose = start(sourceOf({ ...DEFAULT_SKIN }).source)
    iconElement()!.remove()
    expect(iconElement()).toBeNull()

    await new Promise<void>((resolve) => { setTimeout(resolve, 0) })

    expect(iconElement()).not.toBeNull()
    dispose()
  })

  it('reacts to a configuration change without a page reload', async () => {
    const { source, publish } = sourceOf({ ...DEFAULT_SKIN })
    const dispose = start(source)

    // A configuration change rides the same coalesced pass as a DOM mutation.
    publish({ ...DEFAULT_SKIN, text: '少女祈祷中！', color: 'red' })
    await settle()

    expect(labelElement().textContent).toBe('少女祈祷中！，用时 16分0秒...')
    expect(runningElement().style.getPropertyValue(COLOR_PROPERTY)).toBe('red')
    dispose()
  })

  it('stays idempotent across repeated passes', async () => {
    const dispose = start(sourceOf({ ...DEFAULT_SKIN }).source)
    await settle()
    await settle()

    expect(document.querySelectorAll(`[${ICON_ATTRIBUTE}]`)).toHaveLength(1)
    expect(document.querySelectorAll('style[data-dsh-deep-diving-skin-style]')).toHaveLength(1)
    expect(labelElement().textContent).toBe('少女祈祷中，用时 16分0秒...')
    dispose()
  })

  it('leaves an unrecognised label alone', () => {
    document.body.innerHTML = runningMarkup('完全不同的一句话', '深度求索中...')
    const dispose = start(sourceOf({ ...DEFAULT_SKIN }).source)

    expect(labelElement().textContent).toBe('完全不同的一句话')
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

    dispose()

    expect(iconElement()).toBeNull()
    expect(document.querySelector('style[data-dsh-deep-diving-skin-style]')).toBeNull()
    expect(document.querySelector('svg')!.style.display).toBe('')
    expect(runningElement().style.getPropertyValue(COLOR_PROPERTY)).toBe('')
    expect(labelElement().textContent).toBe('深度求索中，用时 16分0秒...')
  })

  it('patches every running-status line on the page', () => {
    document.body.innerHTML = `${runningMarkup('深度求索中，用时 1分0秒...')}${runningMarkup('深度求索中...', '深度求索中...')}`
    const dispose = start(sourceOf({ ...DEFAULT_SKIN }).source)

    expect(document.querySelectorAll(`[${ICON_ATTRIBUTE}]`)).toHaveLength(2)
    expect([...document.querySelectorAll('[data-text-shimmer]')].map(node => node.textContent))
      .toEqual(['少女祈祷中，用时 1分0秒...', '少女祈祷中...'])
    dispose()
  })
})
