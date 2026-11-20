import { defineConfig } from 'vitest/config'

// Add a package to the list below when it gets its first tests. Tests live in
// the package's `test` folder, outside of `src`, so they're never part of the
// package build output.
const testedPackages = [
  'optimizely-one-nextjs',
  'optimizely-cms-nextjs',
  'optimizely-graph-cli'
]

export default defineConfig({
  test: {
    projects: testedPackages.map(name => ({
      test: {
        name,
        root: `./packages/${name}`,
        include: ['test/**/*.test.{ts,tsx}']
      }
    }))
  }
})
