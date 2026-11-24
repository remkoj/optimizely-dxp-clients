import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { DefaultComponentFactory, TYPE_MERGE_SYMBOL } from '../src/factory/index.js'
import type { ComponentType } from '../src/factory/types.js'

/** Create a uniquely identifiable component that renders its name */
function makeComponent(name: string) {
  return Object.assign(() => <span>{name}</span>, { displayName: name })
}

/** Resolve the handle and return the name of the component that was found */
function resolveName(factory: DefaultComponentFactory, handle: string | string[], variant?: string) {
  const Resolved = factory.resolve(handle, variant) as ComponentType | undefined
  if (!Resolved) return undefined
  return renderToStaticMarkup(<Resolved />).replace(/<\/?span>/g, '')
}

const Foo = makeComponent('Foo')
const Bar = makeComponent('Bar')
const FooHeader = makeComponent('FooHeader')

/** All console output of the factory, which must stay silent unless debugging */
let consoleSpies: Record<'log' | 'info' | 'debug' | 'warn' | 'error', MockInstance>

function consoleCalls() {
  return Object.values(consoleSpies).reduce((total, spy) => total + spy.mock.calls.length, 0)
}

beforeEach(() => {
  consoleSpies = {
    log: vi.spyOn(console, 'log').mockImplementation(() => undefined),
    info: vi.spyOn(console, 'info').mockImplementation(() => undefined),
    debug: vi.spyOn(console, 'debug').mockImplementation(() => undefined),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => undefined),
    error: vi.spyOn(console, 'error').mockImplementation(() => undefined)
  }
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('DefaultComponentFactory registration and lookup', () => {
  it('registers and resolves a component by type', () => {
    const factory = new DefaultComponentFactory()
    expect(factory.has('Foo')).toBe(false)
    expect(factory.resolve('Foo')).toBeUndefined()

    factory.register('Foo', Foo)

    expect(factory.has('Foo')).toBe(true)
    expect(factory.resolve('Foo')).toBe(Foo)
    expect(consoleCalls()).toBe(0)
  })

  it('registers the components from the constructor and from registerAll', () => {
    const factory = new DefaultComponentFactory([{ type: 'Foo', component: Foo }])
    factory.registerAll([{ type: 'Bar', component: Bar }])

    expect(factory.resolve('Foo')).toBe(Foo)
    expect(factory.resolve('Bar')).toBe(Bar)
  })

  it('replaces a component that is registered again', () => {
    const factory = new DefaultComponentFactory()
    factory.register('Foo', Foo)
    factory.register('Foo', Bar)

    expect(factory.resolve('Foo')).toBe(Bar)
    expect(factory.extract()).toHaveLength(1)
  })

  it('treats a string handle and an array handle as the same type', () => {
    const factory = new DefaultComponentFactory()
    factory.register(['Foo'], Foo)

    expect(factory.resolve('Foo')).toBe(Foo)
    expect(factory.resolve(['Foo'])).toBe(Foo)
    expect(TYPE_MERGE_SYMBOL).toBe('/')
  })

  it('registers a multi-part handle by its most specific (last) part', () => {
    const factory = new DefaultComponentFactory()
    factory.register(['Base', 'Foo'], Foo)
    factory.register('Base/Bar', Bar)

    expect(factory.extract().map(e => e.type).sort()).toEqual(['Bar/default', 'Foo/default'])
  })

  it('uses the type name of Component, Page and Experience handles, with the last part as variant', () => {
    const factory = new DefaultComponentFactory()
    factory.register(['Component', 'Foo', 'header'], FooHeader)
    factory.register(['Page', 'Bar', 'default'], Bar)

    expect(factory.extract().map(e => e.type).sort()).toEqual(['Bar/default', 'Foo/header'])
    expect(factory.resolve('Foo', 'header')).toBe(FooHeader)
  })

  it('prefixes RichText types, so they cannot clash with regular types', () => {
    const factory = new DefaultComponentFactory()
    factory.register('RichText/text', Foo)

    expect(factory.extract().map(e => e.type)).toEqual(['RichText/text/default'])
    expect(factory.resolve('RichText/text')).toBe(Foo)
    expect(factory.has('text')).toBe(false)
  })

  it('rejects handles that are not a string or a list of strings', () => {
    const factory = new DefaultComponentFactory()
    expect(() => factory.register([1] as unknown as string[], Foo)).toThrow(/Invalid component type handle/)
    expect(() => factory.has([1] as unknown as string[])).toThrow(/Invalid component type handle/)
    expect(() => factory.resolve([null] as unknown as string[])).toThrow(/Invalid component type handle/)
  })

  it('extracts the registered components', () => {
    const factory = new DefaultComponentFactory()
    factory.register('Foo', Foo, true, Bar, 'header', true)
    const extracted = factory.extract()

    expect(extracted).toEqual([{ type: 'Foo/header', component: Foo, useSuspense: true, loader: Bar, variant: 'header', isClient: true }])
  })

  it('removes components, and reports success for components that are not registered', () => {
    const factory = new DefaultComponentFactory()
    factory.register('Foo', Foo)
    factory.register('Foo', FooHeader, false, undefined, 'header')

    expect(factory.remove('Foo')).toBe(true)
    expect(factory.has('Foo')).toBe(false)
    expect(factory.has('Foo', 'header')).toBe(true) // Only the default variant is removed
    expect(factory.remove('Unknown')).toBe(true)
  })

  it('stores the default variant when none is provided', () => {
    const factory = new DefaultComponentFactory()
    factory.register('Foo', Foo)

    expect(factory.extract()[0].variant).toBe(factory.defaultVariant)
  })
})

describe('DefaultComponentFactory variants', () => {
  it('resolves the requested variant', () => {
    const factory = new DefaultComponentFactory()
    factory.register('Foo', Foo)
    factory.register('Foo', FooHeader, false, undefined, 'header')

    expect(resolveName(factory, 'Foo')).toBe('Foo')
    expect(resolveName(factory, 'Foo', 'header')).toBe('FooHeader')
    expect(resolveName(factory, 'Foo', 'default')).toBe('Foo')
  })

  it('does not fall back to the default variant when a specific variant is requested', () => {
    const factory = new DefaultComponentFactory()
    factory.register('Foo', Foo)

    expect(factory.has('Foo', 'header')).toBe(false)
    expect(factory.resolve('Foo', 'header')).toBeUndefined()
  })

  it('does not resolve a registered variant when requesting the default variant', () => {
    const factory = new DefaultComponentFactory()
    factory.register('Foo', FooHeader, false, undefined, 'header')

    expect(factory.has('Foo')).toBe(false)
    expect(factory.resolve('Foo')).toBeUndefined()
  })

  it('resolves variants through the contract fallback', () => {
    const factory = new DefaultComponentFactory()
    factory.register('Foo', Foo)
    factory.register('Foo', FooHeader, false, undefined, 'header')

    expect(resolveName(factory, ['Foo', 'Item'], 'header')).toBe('FooHeader')
    expect(resolveName(factory, ['Foo', 'Item'], 'footer')).toBeUndefined()
  })
})

describe('DefaultComponentFactory contract fallback', () => {
  it('finds the component after removing the ignored contracts', () => {
    const factory = new DefaultComponentFactory()
    factory.register('Foo', Foo)

    expect(factory.has(['Foo', 'Item'])).toBe(true)
    expect(factory.has(['Foo', 'Content', 'Item'])).toBe(true)
    expect(factory.has(['Foo', 'AssetItem'])).toBe(true)
    expect(factory.has(['Foo', 'ImageItem'])).toBe(true)
    expect(resolveName(factory, ['Foo', 'Item'])).toBe('Foo')
    expect(resolveName(factory, 'Foo/Content')).toBe('Foo')
  })

  it('ignores contracts case insensitive', () => {
    const factory = new DefaultComponentFactory()
    factory.register('Foo', Foo)

    expect(factory.has(['Foo', 'ITEM'])).toBe(true)
    expect(factory.has(['Foo', 'imageitem'])).toBe(true)
  })

  it('prefers the most specific (last) type over the less specific ones', () => {
    const factory = new DefaultComponentFactory()
    factory.register('Foo', Foo)
    expect(resolveName(factory, ['Foo', 'Bar'])).toBe('Foo')

    factory.register('Bar', Bar)
    expect(resolveName(factory, ['Foo', 'Bar'])).toBe('Bar')
    expect(resolveName(factory, ['Foo', 'Bar', 'Item'])).toBe('Bar')

    factory.remove('Bar')
    expect(resolveName(factory, ['Foo', 'Bar'])).toBe('Foo')
  })

  it('does not find unrelated types', () => {
    const factory = new DefaultComponentFactory()
    factory.register('Foo', Foo)

    expect(factory.has(['Other', 'Item'])).toBe(false)
    expect(factory.resolve(['Other', 'Item'])).toBeUndefined()
    expect(factory.has('Fo')).toBe(false)
  })

  it('handles lists that only consist of ignored contracts', () => {
    const factory = new DefaultComponentFactory()
    factory.register('Foo', Foo)

    expect(factory.has(['Item', 'Content'])).toBe(false)
    expect(factory.resolve(['Item', 'Content'])).toBeUndefined()
    expect(factory.has([])).toBe(false)
  })

  it('reports the same result for has and resolve', () => {
    const factory = new DefaultComponentFactory()
    factory.register('Foo', Foo)
    factory.register('Foo', FooHeader, false, undefined, 'header')

    const handles: Array<[string | string[], string | undefined]> = [
      ['Foo', undefined], ['Foo', 'header'], ['Foo', 'footer'], [['Foo', 'Item'], undefined],
      [['Foo', 'Item'], 'header'], [['Bar', 'Foo'], undefined], [['Item'], undefined], ['Bar', undefined]
    ]
    for (const [handle, variant] of handles)
      expect(factory.has(handle, variant), `${handle} ${variant}`).toBe(factory.resolve(handle, variant) !== undefined)
  })
})

describe('DefaultComponentFactory ignoredContracts', () => {
  it('ignores the common SaaS CMS contracts by default', () => {
    const factory = new DefaultComponentFactory()

    expect(factory.ignoredContracts).toEqual(['item', 'assetitem', 'imageitem', 'content'])
  })

  it('skips a registered contract type that is on the ignore list', () => {
    const factory = new DefaultComponentFactory()
    factory.register('Foo', Foo)
    factory.register('Item', Bar)

    expect(resolveName(factory, ['Foo', 'Item'])).toBe('Foo')
  })

  it('stops ignoring a contract once it has been removed from the list', () => {
    const factory = new DefaultComponentFactory()
    factory.register('Foo', Foo)
    factory.register('Item', Bar)
    factory.ignoredContracts = []

    expect(resolveName(factory, ['Foo', 'Item'])).toBe('Bar')
  })

  it('ignores the contracts that are added to the list', () => {
    const factory = new DefaultComponentFactory()
    factory.register('Foo', Foo)
    factory.register('Special', Bar)
    expect(resolveName(factory, ['Foo', 'Special'])).toBe('Bar')

    factory.ignoredContracts.push('special')
    expect(resolveName(factory, ['Foo', 'Special'])).toBe('Foo')
  })

  it('has a separate list for every factory', () => {
    const first = new DefaultComponentFactory()
    const second = new DefaultComponentFactory()
    first.ignoredContracts.push('special')

    expect(second.ignoredContracts).not.toContain('special')
  })
})

describe('DefaultComponentFactory without fallback', () => {
  it('only uses the exact type, without removing contracts', () => {
    const factory = new DefaultComponentFactory(undefined, false)
    factory.register('Foo', Foo)
    factory.register('Item', Bar)

    expect(factory.has('Foo')).toBe(true)
    expect(factory.has(['Foo', 'Item'])).toBe(true) // 'Item' is the exact (last) part and is registered
    expect(resolveName(factory, ['Foo', 'Item'])).toBe('Bar')
    expect(resolveName(factory, ['Bar', 'Foo'])).toBe('Foo')
  })

  it('does not fall back to less specific types', () => {
    const factory = new DefaultComponentFactory([{ type: 'Foo', component: Foo }], false)

    expect(factory.has(['Foo', 'Item'])).toBe(false)
    expect(factory.resolve(['Foo', 'Bar'])).toBeUndefined()
    expect(factory.has(['Bar', 'Foo'])).toBe(true)
  })

  it('keeps resolving variants exactly', () => {
    const factory = new DefaultComponentFactory(undefined, false)
    factory.register('Foo', Foo)
    factory.register('Foo', FooHeader, false, undefined, 'header')

    expect(resolveName(factory, 'Foo', 'header')).toBe('FooHeader')
    expect(factory.has('Foo', 'footer')).toBe(false)
  })
})

describe('DefaultComponentFactory component wrapping', () => {
  it('returns the registered component when Suspense is not used', () => {
    const factory = new DefaultComponentFactory()
    factory.register('Foo', Foo, false)

    expect(factory.resolve('Foo')).toBe(Foo)
  })

  it('wraps the component in Suspense when requested', () => {
    const factory = new DefaultComponentFactory()
    factory.register('Foo', Foo, true, Bar)
    const Resolved = factory.resolve('Foo') as ComponentType

    expect(Resolved).not.toBe(Foo)
    expect(renderToStaticMarkup(<Resolved />)).toBe('<span>Foo</span>')
  })

  it('wraps components that are found through the fallback in Suspense as well', () => {
    const factory = new DefaultComponentFactory()
    factory.register('Foo', Foo, true)
    const Resolved = factory.resolve(['Foo', 'Item']) as ComponentType

    expect(Resolved).not.toBe(Foo)
    expect(renderToStaticMarkup(<Resolved />)).toBe('<span>Foo</span>')
  })

  it('hands the serializable context to Client Components', () => {
    const received: Array<Record<string, unknown>> = []
    const ClientComponent = (props: Record<string, unknown>) => {
      received.push(props)
      return null
    }
    const factory = new DefaultComponentFactory()
    factory.register('Foo', ClientComponent, false, undefined, undefined, true)
    const Resolved = factory.resolve('Foo') as ComponentType<Record<string, unknown>>
    const ctx = { toJSON: () => ({ serialized: true }) }

    renderToStaticMarkup(<Resolved ctx={ctx} editProps={{ ctx, other: 1 }} title="x" />)

    expect(Resolved).not.toBe(ClientComponent)
    expect(factory.resolve('Foo')).toBe(Resolved) // The boundary is reused
    expect(received[0]).toEqual({ ctx: { serialized: true }, editProps: { ctx: { serialized: true }, other: 1 }, title: 'x' })
  })
})

describe('DefaultComponentFactory logging', () => {
  it('is silent for all operations when not debugging', () => {
    const factory = new DefaultComponentFactory()
    factory.register('Foo', Foo, true)
    factory.has('Foo')
    factory.has('Missing')
    factory.resolve('Foo')
    factory.resolve(['Foo', 'Item'])
    factory.resolve('Missing')
    factory.remove('Foo')

    expect(consoleCalls()).toBe(0)
  })

  it('reports registration, lookups and failures when OPTIMIZELY_DEBUG is enabled', () => {
    vi.stubEnv('OPTIMIZELY_DEBUG', '1')
    const factory = new DefaultComponentFactory()
    factory.register('Foo', Foo)
    factory.has(['Foo', 'Item'])
    factory.resolve(['Foo', 'Item'])
    factory.resolve('Missing')

    expect(consoleSpies.log.mock.calls.map(c => String(c[0])).join('\n')).toMatch(/Registering Foo\/default[\s\S]*Checking for Item\/default - YES[\s\S]*Resolved component for Foo\/default/)
    expect(consoleSpies.warn.mock.calls.map(c => String(c[0])).join('\n')).toMatch(/Unable to resolve Missing\/default/)
  })
})
