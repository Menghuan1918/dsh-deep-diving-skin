/**
 * The manifest's plugin icon must satisfy what the host's `readPluginMeta`
 * enforces: a relative path, inside the manifest directory, in one of the four
 * accepted formats, and at most 256 KiB. A violation is not silent — the
 * plugin's card shows the resulting error instead of artwork.
 */
import { readFileSync, statSync } from 'node:fs'
import { dirname, extname, isAbsolute, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  icon?: string
  files?: string[]
}

/** Copy of the host's accepted media types. */
const ICON_MEDIA_TYPES = new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp'])
/** Copy of the host's size ceiling. */
const ICON_MAX_BYTES = 256 * 1024

describe('plugin icon', () => {
  it('is declared and resolvable from the manifest directory', () => {
    const icon = manifest.icon
    expect(typeof icon).toBe('string')
    expect(isAbsolute(icon!)).toBe(false)
    expect(/^[A-Za-z][A-Za-z\d+.-]*:/u.test(icon!)).toBe(false)
    expect(ICON_MEDIA_TYPES.has(extname(icon!).toLowerCase())).toBe(true)

    const file = join(root, icon!)
    expect(relative(root, file).startsWith('..')).toBe(false)
    expect(statSync(file).isFile()).toBe(true)
    expect(statSync(file).size).toBeLessThanOrEqual(ICON_MAX_BYTES)
  })

  it('is published with the package', () => {
    const icon = manifest.icon!.replace(/^\.\//, '')
    expect(manifest.files?.some(entry => entry === icon || icon.startsWith(`${entry}/`))).toBe(true)
  })

  it('stays inside the manifest directory', () => {
    expect(dirname(join(root, manifest.icon!))).toBe(root)
  })
})
