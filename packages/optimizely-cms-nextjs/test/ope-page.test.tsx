import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReactElement, ReactNode } from 'react'

vi.mock('server-only', () => ({}))
vi.mock('next/navigation.js', () => ({
  notFound: () => 'not-found'
}))
vi.mock('next/script.js', () => ({ default: () => null }))
vi.mock('../src/ope/load-content.js', () => ({
  default: vi.fn(async () => ({
    contentLink: { key: 'abcdef', locale: 'en' },
    contentItem: {},
    contentType: ['Page']
  }))
}))

import { createEditPageComponent } from '../src/ope/page.js'

function collectText(node: ReactNode, out: string[] = []): string[] {
  if (node === null || node === undefined || typeof node === 'boolean')
    return out
  if (typeof node === 'string' || typeof node === 'number') {
    out.push(String(node))
    return out
  }
  if (Array.isArray(node)) {
    node.forEach(child => collectText(child, out))
    return out
  }
  collectText((node as ReactElement<{ children?: ReactNode }>).props?.children, out)
  return out
}

function createPage(debug: boolean) {
  vi.stubEnv('OPTIMIZELY_DEBUG', debug ? '1' : '0')
  return createEditPageComponent({} as never, {
    clientFactory: (() => ({ siteInfo: { cmsURL: new URL('https://cms.example.com') } })) as never,
    requestValidator: () => true,
    contentResolver: (() => ({ key: 'abcdef', locale: 'en', ctx: 'edit' })) as never
  })
}

describe('createEditPageComponent', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('returns notFound for an invalid request', async () => {
    const page = createEditPageComponent({} as never, { requestValidator: () => false })
    expect(await page({ params: Promise.resolve({}), searchParams: Promise.resolve({}) } as never)).toBe('not-found')
  })

  it('renders the debug content link of the loaded content', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const page = createPage(true)
    const output = await page({ params: Promise.resolve({}), searchParams: Promise.resolve({}) } as never)
    const text = collectText(output).join('')
    expect(text).toContain('ContentItem:')
    expect(text).not.toContain('Invalid content link')
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[OnPageEdit] Requested content:'), expect.any(String))
    expect(log).toHaveBeenCalledWith(expect.stringContaining('[OnPageEdit] Identified content:'), expect.any(String))
  })

  it('does not render the debug content link when not debugging', async () => {
    const page = createPage(false)
    const output = await page({ params: Promise.resolve({}), searchParams: Promise.resolve({}) } as never)
    expect(collectText(output).join('')).not.toContain('ContentItem:')
  })
})
