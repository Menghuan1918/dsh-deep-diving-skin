/**
 * The settings document and the shared configuration contract: field-by-field
 * degradation, the icon allowlist, and the rotation clamp.
 */
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SKIN,
  ICON_MAX_CHARS,
  SPIN_SECONDS_MAX,
  SPIN_SECONDS_MIN,
  normalizeSkinConfig,
  skinConfigProblem,
} from '../src/skin-config.ts'
import { readSkinConfig, skinConfigPath, writeSkinConfig } from '../src/store.ts'

const tempDir = mkdtempSync(join(tmpdir(), 'dsh-deep-diving-skin-'))

function tempFile(name: string): string {
  return join(tempDir, name)
}

describe('configuration contract', () => {
  it('falls back field by field', () => {
    expect(normalizeSkinConfig(undefined)).toEqual(DEFAULT_SKIN)
    expect(normalizeSkinConfig({ text: '', color: 42, spin: 'yes', spinSeconds: 'fast' })).toEqual(DEFAULT_SKIN)
    expect(normalizeSkinConfig({ text: '祈祷中' })).toEqual({ ...DEFAULT_SKIN, text: '祈祷中' })
    expect(normalizeSkinConfig({ icon: 'javascript:alert(1)' })).toEqual(DEFAULT_SKIN)
    expect(normalizeSkinConfig({ icon: 'https://example.com/a.svg' }).icon).toBe('https://example.com/a.svg')
  })

  it('bounds the rotation period', () => {
    expect(normalizeSkinConfig({ spinSeconds: 0 }).spinSeconds).toBe(SPIN_SECONDS_MIN)
    expect(normalizeSkinConfig({ spinSeconds: 1000 }).spinSeconds).toBe(SPIN_SECONDS_MAX)
    expect(normalizeSkinConfig({ spinSeconds: 2.5 }).spinSeconds).toBe(2.5)
  })

  it('accepts only image-shaped icon sources', () => {
    expect(skinConfigProblem({ icon: '' })).toBeUndefined()
    expect(skinConfigProblem({ icon: 'data:image/svg+xml,%3Csvg%2F%3E' })).toBeUndefined()
    expect(skinConfigProblem({ icon: '/assets/icon.svg' })).toBeUndefined()
    expect(skinConfigProblem({ icon: 'javascript:alert(1)' })).toContain('icon must be')
    expect(skinConfigProblem({ icon: 'data:text/html,<script>' })).toContain('icon must be')
    expect(skinConfigProblem({ icon: `data:image/png;base64,${'A'.repeat(ICON_MAX_CHARS)}` })).toContain('icon must be')
    // A quote would end the CSS url("…") string early.
    expect(skinConfigProblem({ icon: 'https://example.com/a".svg' })).toContain('icon must be')
  })

  it('rejects writes that name a wrong-typed field', () => {
    expect(skinConfigProblem('nope')).toBe('expected a JSON object')
    expect(skinConfigProblem({ spin: 1 })).toBe('spin must be a boolean')
    expect(skinConfigProblem({ text: '' })).toContain('text must be')
    expect(skinConfigProblem({ color: '' })).toContain('color must be')
    expect(skinConfigProblem({ spinSeconds: 'fast' })).toBe('spinSeconds must be a number')
    expect(skinConfigProblem({ text: 'ok', color: '#fff' })).toBeUndefined()
  })
})

describe('settings document', () => {
  it('resolves under the harness home', () => {
    expect(skinConfigPath('/srv/dsh')).toBe('/srv/dsh/deep-diving-skin.json')
  })

  it('reads the shipped preset when the document is absent or corrupt', () => {
    expect(readSkinConfig(tempFile('absent.json'))).toEqual(DEFAULT_SKIN)
    const broken = tempFile('broken.json')
    writeFileSync(broken, '{ not json')
    expect(readSkinConfig(broken)).toEqual(DEFAULT_SKIN)
  })

  it('round-trips a written configuration', () => {
    const file = tempFile('nested/dir/skin.json')
    const written = writeSkinConfig(file, { ...DEFAULT_SKIN, icon: 'data:image/gif;base64,R0lGOD', text: '祈祷中' })
    expect(written.text).toBe('祈祷中')
    expect(readSkinConfig(file)).toEqual(written)
    expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual(written)
  })
})
