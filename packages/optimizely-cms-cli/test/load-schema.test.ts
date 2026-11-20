import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadSchema } from '../src/tools/loadSchema'

describe('loadSchema', () => {
  beforeEach(() => {
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves local $ref entries into definitions of the constructed schema', async () => {
    const client = {
      getSchemaItemBase: () => new URL('https://cms.example.com/schemas/'),
      getOpenApiSpec: async () => ({
        components: {
          schemas: {
            Root: {
              type: 'object',
              properties: {
                child: { $ref: '#/components/schemas/Child' }
              }
            },
            Child: { type: 'string' }
          }
        }
      })
    }

    const result = await loadSchema(client as never, 'Root')

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Root')
    expect(result[0].schema.definitions).toHaveProperty('Child')
    expect(JSON.stringify(result[0].schema)).toContain('#/definitions/Child')
  })
})
