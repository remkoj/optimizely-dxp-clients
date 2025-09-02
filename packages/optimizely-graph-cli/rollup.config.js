import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import packageInfo from './package.json' with { type: "json"};

function getExternals() {
  const deps = Object.getOwnPropertyNames(packageInfo.dependencies ?? {})
  const peerDeps = Object.getOwnPropertyNames(packageInfo.peerDependencies ?? {})
  return [...[...deps, ...peerDeps].map(x => new RegExp(`^${ x }(\/.+){0,1}$`)), /^node\:[a-z\_\/]+$/]
}
const year = new Date().getFullYear();

const intro =`#!/usr/bin/env node
/**
 * Frontend Utility providing helpers for common tasks when building a Vercel
 * hosted, Next.JS based website that uses Optimizely Graph as content 
 * repository.
 * 
 * License: Apache 2
 * Copyright (c) 2023-${ year } - Remko Jantzen
 */`

export default {
    input: "src/index.ts",
    output: {
        dir: "bin",
        intro,
        format: 'es',
        sourcemap: true
  },
    external: getExternals(),
    plugins: [
        typescript({
            outDir: "./bin"
        }),
        json({
            preferConst: true
        }),
        commonjs({
            extensions: ['.js','.cjs']
        })
    ]
}