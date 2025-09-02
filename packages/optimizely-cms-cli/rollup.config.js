import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import tsConfig from './tsconfig.json' with { type: "json" };
import typescriptSdk from "typescript"
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
      include: "{,**/}*.(cts|mts|ts|tsx|js|jsx)",
      exclude: "src/**/*.json",
      outputToFilesystem: true,
      compilerOptions: tsConfig.compilerOptions,
      typescript: typescriptSdk
    }), 
    json({ 
      include: "src/**/*.json" 
    })
  ]
};