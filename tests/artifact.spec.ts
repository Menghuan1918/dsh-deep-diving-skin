/**
 * The built browser half must be exactly what `dsh-client-modules` expects: a
 * lazy-CJS factory registering the bundle under the package name, resolving
 * every bare import from the shell's module table.
 */
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const clientPath = `${root}lib/client.js`

/** The shell's frozen module table, read off the running dsh 0.2.0-rc.1 build. */
const PLATFORM_MODULES = new Set([
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-dockkit',
])

function clientBundle(): string {
  if (!existsSync(clientPath)) throw new Error(`${clientPath} is missing — run \`pnpm build\` first`)
  return readFileSync(clientPath, 'utf8')
}

describe('built client bundle', () => {
  it('registers the factory under the package name', () => {
    const source = clientBundle()
    const manifest = JSON.parse(readFileSync(`${root}package.json`, 'utf8')) as { name: string }

    expect(source.startsWith(`window.__ModuleLoader__.load({\n\tid: ${JSON.stringify(manifest.name)},`)).toBe(true)
    // The factory closes before the source-map trailer tsdown appends.
    expect(source).toMatch(/return module\.exports;\s*\}\s*\}\);\s*\/\/# sourceMappingURL=client\.js\.map\s*$/u)
    expect(source).toContain('exports.apply = apply;')
    expect(source).toContain('exports.inject = inject;')
  })

  it('resolves every bare import from the module table', () => {
    const source = clientBundle()
    const specifiers = [...source.matchAll(/require\("([^"]+)"\)/gu)].map(match => match[1]!)

    expect(specifiers.length).toBeGreaterThan(0)
    for (const specifier of specifiers) expect(PLATFORM_MODULES.has(specifier)).toBe(true)
  })

  it('leaves no build-time environment reference behind', () => {
    expect(clientBundle()).not.toMatch(/process\.env|import\.meta/u)
  })
})
