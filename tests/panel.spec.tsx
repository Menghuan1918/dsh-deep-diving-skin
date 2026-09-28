// @vitest-environment jsdom
/**
 * The configuration page, driven through the props the renderer hands it:
 * the derived `view`/`t` shares plus the injected settings face.
 */
import { act, createElement, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { zh } from '../src/client/locales.ts'
import { SkinPanel, toDataUrl, type SkinPanelProps } from '../src/client/panel.tsx'
import { DEFAULT_SKIN, UPLOAD_MAX_BYTES, type SkinConfig } from '../src/skin-config.ts'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

/** Dictionary lookup with the same `{name}` interpolation the renderer's `t` uses. */
function translate(key: keyof typeof zh, params?: Record<string, unknown>): string {
  const template: string = zh[key]
  return template.replace(/\{(\w+)\}/g, (_match, name: string) => String(params?.[name] ?? ''))
}

interface Harness {
  readonly root: Root
  readonly container: HTMLElement
  readonly save: ReturnType<typeof vi.fn>
  readonly reset: ReturnType<typeof vi.fn>
  publish(next: SkinConfig): void
  render(overrides?: Partial<SkinPanelProps>): void
}

let harness: Harness | undefined

function setup(initial: SkinConfig = { ...DEFAULT_SKIN }): Harness {
  let snapshot = initial
  const listeners = new Set<() => void>()
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  const save = vi.fn(async (patch: Partial<SkinConfig>) => ({ ...snapshot, ...patch }))
  const reset = vi.fn(async () => ({ ...DEFAULT_SKIN }))

  const created: Harness = {
    root,
    container,
    save,
    reset,
    publish(next) {
      snapshot = next
      for (const listener of [...listeners]) listener()
    },
    render(overrides) {
      act(() => {
        root.render(createElement(SkinPanel, {
          view: 'page',
          useConfig: (selector: (config: SkinConfig) => unknown) => selector(snapshot),
          t: translate,
          save,
          reset,
          ...overrides,
        } as SkinPanelProps) as ReactElement)
      })
    },
  }
  created.render()
  return created
}

function inputByValue(container: HTMLElement, value: string): HTMLInputElement {
  const found = [...container.querySelectorAll('input')].find(input => input.value === value)
  if (found === undefined) throw new Error(`no input carrying the value ${JSON.stringify(value)}`)
  return found
}

function typeInto(input: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set
  setter?.call(input, value)
  act(() => { input.dispatchEvent(new Event('input', { bubbles: true })) })
}

function buttonByText(container: HTMLElement, label: string): HTMLButtonElement {
  const found = [...container.querySelectorAll('button')].find(button => button.textContent === label)
  if (found === undefined) throw new Error(`no button labelled ${JSON.stringify(label)}`)
  return found
}

async function click(button: HTMLButtonElement): Promise<void> {
  await act(async () => { button.dispatchEvent(new MouseEvent('click', { bubbles: true })) })
}

beforeEach(() => { harness = setup() })

afterEach(() => {
  const current = harness
  harness = undefined
  if (current === undefined) return
  act(() => { current.root.unmount() })
  current.container.remove()
})

describe('configuration page', () => {
  it('renders the current configuration', () => {
    const current = harness!
    expect(inputByValue(current.container, DEFAULT_SKIN.text)).toBeInstanceOf(HTMLInputElement)
    expect(inputByValue(current.container, DEFAULT_SKIN.color)).toBeInstanceOf(HTMLInputElement)
    expect(current.container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked).toBe(true)
    expect(current.container.querySelector<HTMLInputElement>('input[type="number"]')!.value).toBe('3')
  })

  it('renders the row summary without the form', () => {
    const current = setup()
    current.render({ view: 'summary' })
    expect(current.container.textContent).toBe(zh.summary)
  })

  it('saves an edited draft', async () => {
    const current = harness!
    typeInto(inputByValue(current.container, DEFAULT_SKIN.text), '祈祷中')
    typeInto(inputByValue(current.container, DEFAULT_SKIN.color), '#3366ff')
    await click(buttonByText(current.container, zh.save))

    expect(current.save).toHaveBeenCalledWith({ ...DEFAULT_SKIN, text: '祈祷中', color: '#3366ff' })
    expect(current.container.textContent).toContain(zh.saved)
  })

  it('reports a refused save', async () => {
    const current = harness!
    current.save.mockRejectedValueOnce(new Error('icon must be empty or a URL'))
    await click(buttonByText(current.container, zh.save))

    expect(current.container.textContent).toContain(zh.saveFailed)
    expect(current.container.textContent).toContain('icon must be empty or a URL')
  })

  it('resets every field', async () => {
    const current = harness!
    typeInto(inputByValue(current.container, DEFAULT_SKIN.text), '祈祷中')
    await click(buttonByText(current.container, zh.resetAll))

    expect(current.reset).toHaveBeenCalledTimes(1)
    expect(inputByValue(current.container, DEFAULT_SKIN.text)).toBeInstanceOf(HTMLInputElement)
  })

  it('re-seeds the draft when the stored configuration changes', () => {
    const current = harness!
    current.publish({ ...DEFAULT_SKIN, text: '来自宿主的文本' })
    current.render()
    expect(inputByValue(current.container, '来自宿主的文本')).toBeInstanceOf(HTMLInputElement)
  })

  it('refuses an oversized icon upload', () => {
    const current = harness!
    const file = new File([new Uint8Array(UPLOAD_MAX_BYTES + 1)], 'big.gif', { type: 'image/gif' })
    const picker = current.container.querySelector<HTMLInputElement>('input[type="file"]')!
    Object.defineProperty(picker, 'files', { value: [file], configurable: true })
    act(() => { picker.dispatchEvent(new Event('change', { bubbles: true })) })

    expect(current.container.textContent).toContain(zh.saveFailed)
    expect(current.container.textContent).toContain('1025 KB')
  })
})

describe('icon upload', () => {
  it('reads a small file as a data URI', async () => {
    const file = new File(['<svg xmlns="http://www.w3.org/2000/svg"/>'], 'icon.svg', { type: 'image/svg+xml' })
    const uri = await toDataUrl(file)

    expect(uri.startsWith('data:image/svg+xml;base64,')).toBe(true)
    expect(Buffer.from(uri.split(',')[1]!, 'base64').toString('utf8')).toContain('<svg')
  })
})
