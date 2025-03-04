import { globSync } from 'glob'
import fs from 'node:fs'
import path from 'node:path'

console.log(`📢 Bundling included API Client code`)

const files = globSync([
  './src/client/client/*js',
  './src/client/client/*.d.*ts',
])

try {
  fs.mkdirSync('./dist/client/client', { recursive: true })
} catch (e) {
  console.log(e)
}

files.forEach((fn) => {
  const relative = path.relative('./src/client/client', fn)
  let target = path.join('./dist/client/client', relative)

  if (target.endsWith('.cjs'))
    target = target.substring(0, target.length - 4) + '.js'

  fs.copyFileSync(fn, target)
})
