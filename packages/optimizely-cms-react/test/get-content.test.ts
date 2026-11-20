import { afterEach, describe, expect, it, vi } from 'vitest'
import type { IOptiGraphClient } from '@remkoj/optimizely-graph-client'
import { getContent } from '../src/components/cms-content/get-content.js'

const Component = Object.assign(() => null, { displayName: 'TestComponent' })

describe('getContent', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the provided fragment data as is when not loading data', () => {
    const data = { title: 'Hello' }
    expect(getContent(undefined, { key: 'abc' }, Component, data, true)).toBe(data)
  })

  it('wraps the provided fragment data in a promise when loading data', async () => {
    const data = { title: 'Hello' }
    const result = getContent(undefined, { key: 'abc' }, Component, data)
    expect(result).toBeInstanceOf(Promise)
    expect(await result).toBe(data)
  })

  it('returns an empty object for a content link without data when not loading data', () => {
    expect(getContent(undefined, { key: 'abc' }, Component, undefined, true)).toEqual({})
  })

  it('returns an empty object for inline content without data', async () => {
    const link = { key: null, locale: 'en', __typename: 'Foo' } as unknown as Parameters<typeof getContent>[1]
    expect(getContent(undefined, link, Component, undefined, true)).toEqual({})
    expect(await getContent(undefined, link, Component, undefined)).toEqual({})
  })

  it('resolves to an empty object for a missing content link', async () => {
    expect(await getContent(undefined, undefined, Component, undefined)).toEqual({})
  })

  it('requires a client to load data for a content link', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(() => getContent(undefined, { key: 'abc' }, Component, undefined)).toThrow(/requires a GraphQL Client/)
    expect(error).toHaveBeenCalledWith(expect.stringContaining('Data loading for "TestComponent" requires a GraphQL Client'))
  })

  it('resolves to an empty object for a component without a data source', async () => {
    const client = { debug: false } as unknown as IOptiGraphClient
    expect(await getContent(client, { key: 'abc' }, Component, undefined)).toEqual({})
  })
})
