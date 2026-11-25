import { createClient } from '@hey-api/openapi-ts'
import path from 'node:path'

const SPEC_URL = 'https://cg.optimizely.com/app/swagger/swagger.json'

/**
 * Entry point: generates the typed Optimizely Graph Admin API client from the
 * live OpenAPI specification into `src/admin-api/client`. The hand-written
 * wrapper in `src/admin-api` (`index.ts`) is not generated and
 * builds on `@remkoj/hey-api-wrapper`.
 *
 * @returns {Promise<void>}
 */
;(async function main() {
  process.stdout.write(`➡ Creating Optimizely Graph Admin API Client from ${SPEC_URL}\n`)
  await createClient({
    input: SPEC_URL,
    output: {
      clean: true,
      case: 'camelCase',
      path: path.resolve(path.join(process.cwd(), 'src', 'admin-api', 'client')),
      tsConfigPath: path.resolve(path.join(process.cwd(), 'tsconfig.json'))
    },
    plugins: createPluginConfig()
  })
  process.stdout.write('🏁 Done\n')
})()

/**
 * Builds the `@hey-api/openapi-ts` plugin list: the bundled fetch transport,
 * TypeScript types/enums and the SDK layer, matching the Optimizely CMS API
 * client setup.
 *
 * @returns {Array<object>} The ordered plugin configuration.
 */
function createPluginConfig() {
  return [
    {
      name: '@hey-api/client-fetch',
      bundle: true,
      exportFromIndex: true,
      throwOnError: false
    },
    {
      name: '@hey-api/typescript',
      enums: 'typescript+namespace',
      exportInlineEnums: true,
      identifierCase: 'preserve',
      exportFromIndex: true,
      readableNameBuilder: '{{name}}'
    },
    {
      name: '@hey-api/sdk',
      exportFromIndex: true,
      auth: false,
      client: '@hey-api/client-fetch'
    }
  ]
}
