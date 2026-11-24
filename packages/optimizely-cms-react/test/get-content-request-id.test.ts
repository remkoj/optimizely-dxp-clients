import { afterEach, describe, expect, it, vi } from 'vitest'
import type { IOptiGraphClient } from '@remkoj/optimizely-graph-client'
import { getContent } from '../src/components/cms-content/get-content.js'

const Component = Object.assign(() => null, {
  displayName: 'TestComponent',
  getDataFragment: () => ['TestComponentData', 'fragment TestComponentData on TestComponent { title }']
})

function mockClient(total: number, requestId?: string) {
  return {
    debug: false,
    currentOptiCmsSchema: 'OPTI-CMS-13',
    isPreviewEnabled: () => false,
    getChangeset: () => null,
    request: async () => ({ contentById: { total, items: [] } }),
    getRequestId: requestId ? () => requestId : undefined
  } as unknown as IOptiGraphClient
}

describe('getContent', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('adds the request id of the latest Graph request to the error for missing content', async () => {
    const error = await getContent(mockClient(0, 'req-react'), { key: 'abc' }, Component as never, undefined).catch((e: Error) => e) as Error
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toContain('expected to load exactly one content item of type TestComponentData, received 0')
    expect(error.message).toContain('[request-id: req-react]')
  })

  it('keeps the error as is when the client has no request id', async () => {
    const error = await getContent(mockClient(0), { key: 'abc' }, Component as never, undefined).catch((e: Error) => e) as Error
    expect(error.message).toContain('received 0 from Optimizely Graph')
    expect(error.message).not.toContain('request-id')
  })
})
