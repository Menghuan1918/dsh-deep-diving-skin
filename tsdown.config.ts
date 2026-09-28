import type { UserConfig } from 'tsdown'

/**
 * The bundle id. It MUST equal package.json `name`: `dsh-client-modules` builds
 * one module-table graph row per bare package name and throws
 * `loaded without registering "<id>"` when the artifact registers anything else.
 */
const PLUGIN_ID = 'dsh-deep-diving-skin'

/**
 * The shell's frozen module table. Verified against the running dsh 0.2.0-rc.1
 * build: `dsh-web-frontend/dist/assets/index-*.js` seeds exactly these keys
 * (`react`, `react/jsx-runtime`, `react-dom`, `react-dom/client`,
 * `@deepseek-ai/cordis`, `@deepseek-ai/dsh-client-store`,
 * `@deepseek-ai/dsh-client-ui-slots`, `@deepseek-ai/dsh-client-ui-primitives`,
 * `@deepseek-ai/dsh-client-ui-dockkit`). They are answered by the `require`
 * handed to the factory; everything else the client half imports is inlined,
 * because a bare `require()` the table cannot answer throws at factory
 * execution. Do not copy a vendored preset's list — it may name packages the
 * shell no longer seeds.
 */
const PLATFORM_MODULES = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-dockkit',
]

export default [
  {
    name: `${PLUGIN_ID}/host`,
    entry: { index: 'src/index.ts' },
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    // The build script runs `tsc` first; a tsdown clean here would wipe the
    // declarations it just emitted.
    clean: false,
  },
  {
    name: `${PLUGIN_ID}/client`,
    entry: { client: 'src/client/index.tsx' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    target: 'es2022',
    dts: false,
    sourcemap: true,
    clean: false,
    deps: {
      neverBundle: PLATFORM_MODULES,
      // Anything outside the module table must be inlined: a bare `require()`
      // the table cannot answer throws when the factory runs.
      alwaysBundle: (id: string) => (PLATFORM_MODULES.includes(id) ? undefined : true),
    },
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => {`,
      intro: 'var module = { exports: {} }; var exports = module.exports;',
      footer: 'return module.exports; } });',
    },
  },
] satisfies UserConfig[]
