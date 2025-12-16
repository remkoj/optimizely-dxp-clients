import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import packageInfo from './package.json' with { type: "json"};

function getExternals() {
  const deps = Object.getOwnPropertyNames(packageInfo.dependencies ?? {})
  const peerDeps = Object.getOwnPropertyNames(packageInfo.peerDependencies ?? {})
  return [...[...deps, ...peerDeps].map(x => new RegExp(`^${ x }(\/.+){0,1}$`)), /^node\:[a-z\_\/]+$/]
}

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'module',
    sourcemap: true
  },
  external: getExternals(),
  treeshake: "smallest",
  plugins: [
    typescript({
      filterRoot: import.meta.dirname,
      outputToFilesystem: true
    }), 
    json({ 
      include: "src/**/*.json" 
    })
  ]
};
