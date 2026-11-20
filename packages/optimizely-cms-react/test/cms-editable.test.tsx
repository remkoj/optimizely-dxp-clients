import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { PropsWithChildren } from 'react'
import type { GenericContext } from '../src/context/types.js'
import { CmsEditable } from '../src/components/cms-editable/index.js'

function createContext(overrides: Partial<GenericContext> = {}): GenericContext {
  return {
    inEditMode: false,
    isDebug: false,
    isDebugOrDevelopment: false,
    editableContent: undefined,
    ...overrides
  } as unknown as GenericContext
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CmsEditable', () => {
  it('renders a plain element without markers outside edit mode', () => {
    const html = renderToStaticMarkup(
      <CmsEditable ctx={createContext()} cmsId="abc" cmsFieldName="Title" className="x">
        Hello
      </CmsEditable>
    )
    expect(html).toBe('<div class="x">Hello</div>')
  })

  it('renders an empty element without children outside edit mode', () => {
    const html = renderToStaticMarkup(<CmsEditable ctx={createContext()} as="span" />)
    expect(html).toBe('<span></span>')
  })

  it('adds the edit markers in edit mode and keeps the other props', () => {
    const html = renderToStaticMarkup(
      <CmsEditable
        ctx={createContext({ inEditMode: true })}
        as="h2"
        cmsId="block-1"
        cmsFieldName="Heading"
        className="x"
      >
        Hello
      </CmsEditable>
    )
    expect(html).toBe('<h2 class="x" data-epi-block-id="block-1" data-epi-edit="Heading">Hello</h2>')
  })

  it('renders a content id for 32 character ids', () => {
    const id = 'a'.repeat(32)
    const html = renderToStaticMarkup(
      <CmsEditable ctx={createContext({ inEditMode: true })} cmsId={id} />
    )
    expect(html).toBe(`<div data-epi-block-id="${id}" data-epi-content-id="${id}"></div>`)
  })

  it('omits the markers when the current content differs from the editable content', () => {
    const html = renderToStaticMarkup(
      <CmsEditable
        ctx={createContext({ inEditMode: true, editableContent: { key: 'one' } as GenericContext['editableContent'] })}
        currentContent={{ key: 'two' }}
        cmsId="abc"
        cmsFieldName="Title"
      >
        Hello
      </CmsEditable>
    )
    expect(html).toBe('<div>Hello</div>')
  })

  it('warns in debug mode when rendering without a field name or id in edit mode', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const trace = vi.spyOn(console, 'trace').mockImplementation(() => undefined)
    renderToStaticMarkup(
      <CmsEditable ctx={createContext({ inEditMode: true, isDebugOrDevelopment: true, isDebug: true })} />
    )
    expect(warn).toHaveBeenCalledOnce()
    expect(trace).toHaveBeenCalledOnce()
  })

  it('forwards the context to custom components when requested', () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const ctx = createContext({ inEditMode: true })
    const seen: Array<Record<string, unknown>> = []
    const Custom = (props: PropsWithChildren<Record<string, unknown>>) => {
      seen.push(props)
      return <p>{props.children}</p>
    }

    renderToStaticMarkup(<CmsEditable ctx={ctx} as={Custom} cmsId="abc" forwardCtx>A</CmsEditable>)
    renderToStaticMarkup(<CmsEditable ctx={ctx} as={Custom} cmsId="abc" forwardCtx="context">B</CmsEditable>)
    renderToStaticMarkup(<CmsEditable ctx={ctx} as={Custom} cmsId="abc">C</CmsEditable>)

    expect(seen[0].ctx).toBe(ctx)
    expect(seen[0]['data-epi-block-id']).toBe('abc')
    expect(seen[1].context).toBe(ctx)
    expect(seen[1]).not.toHaveProperty('ctx')
    expect(seen[2]).not.toHaveProperty('ctx')
    expect(seen[2]).not.toHaveProperty('context')
  })
})
