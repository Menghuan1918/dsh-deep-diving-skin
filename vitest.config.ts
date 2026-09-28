import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // The default environment is node; component and DOM specs opt into jsdom
    // with a `// @vitest-environment jsdom` pragma on their first line.
    environment: 'node',
    include: ['tests/**/*.spec.ts', 'tests/**/*.spec.tsx'],
  },
})
