import { defineConfig } from 'vitest/config'

// Add a package to the list below when it gets its first tests. Tests live in
// the package's `test` folder, outside of `src`, so they're never part of the
// package build output.
const testedPackages = [
  'optimizely-one-nextjs',
  'optimizely-cms-nextjs',
  'optimizely-graph-cli',
  'optimizely-cms-api',
  'optimizely-cms-cli',
  'optimizely-cms-react',
  'hey-api-wrapper'
]

// Tests always run as a production build without debug or query logging,
// regardless of the developer's shell or .env files.
const testEnv = {
  NODE_ENV: 'production',
  OPTIMIZELY_DEBUG: '0',
  OPTIMIZELY_GRAPH_QUERY_LOG: '0'
}

export default defineConfig({
  test: {
    projects: testedPackages.map(name => ({
      // NODE_ENV=production removes jsxDEV from React's JSX runtime
      oxc: { jsx: { development: false } },
      test: {
        name,
        env: testEnv,
        root: `./packages/${name}`,
        include: ['test/**/*.test.{ts,tsx}']
      }
    }))
  }
})
