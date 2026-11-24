import type {
  ComponentFactory,
  ComponentType,
  ComponentTypeHandle,
  ComponentTypeDictionary,
  ComponentTypeDictionaryEntry,
} from './types.js'
import { Suspense } from 'react'
import { toSerializableContext } from '../context/shared.js'

const clientBoundaries = new Map<ComponentType, ComponentType>()

export const MERGE_SYMBOL = '/'

export const EmptyComponentHandle = '$$fragment$$'

/**
 * The default implementation of the ComponentFactory interface, which works both
 * client and server side.
 */
export class DefaultComponentFactory implements ComponentFactory {
  private registry = new Map<string, ComponentTypeDictionaryEntry>()
  private dbg: boolean
  private withFallback: boolean

  /**
   * A list of interfaces to ignore when resolving components. Adjust this
   * list if you're experiencing issues with resolving components due to 
   * contracts. Values **must be** provided lowercase and without leading 
   * underscore. For example `_Item` must be provided as `item`.
   * 
   * The default value includes the common ones for SaaS CMS.
   */
  public ignoredContracts: string[] = ['item','assetitem','imageitem','content']

  /**
   * The variant that is used when no variant has been specified
   */
  public readonly defaultVariant: string = 'default'

  /**
   * Create a new instance of the DefaultComponentFactory
   *
   * @param   initialComponents   If provided, this dictionary will be registered
   *                              with the factory.
   * @param   withFallback        When `true` (default), `has` and `resolve` remove
   *                              the `ignoredContracts` from the type and fall back
   *                              from the most specific to the least specific part
   *                              of the type. When `false` only the exact type
   *                              (the last part of the handle) is used.
   */
  public constructor(initialComponents?: ComponentTypeDictionary, withFallback: boolean = true) {
    this.withFallback = withFallback

    // Resolve debug mode
    try {
      this.dbg = process.env.OPTIMIZELY_DEBUG == '1'
    } catch {
      this.dbg = false
    }

    // Add provided default dictionary
    if (initialComponents) this.registerAll(initialComponents)
  }

  /**
   * @inheritDoc
   */
  public register(
    type: ComponentTypeHandle,
    component: ComponentType,
    useSuspense: boolean = false,
    loader?: ComponentType,
    variant: string = this.defaultVariant,
    isClient?: boolean
  ): void {
    const registryKey = this.processComponentTypeHandle(type, variant)
    if (this.dbg)
      console.log(`➕ [DefaultComponentFactory] Registering ${registryKey}`)
    this.registry.set(registryKey, { type: registryKey, component, useSuspense, loader, variant, isClient })
  }

  /**
   * @inheritDoc
   */
  public registerAll(components: ComponentTypeDictionary): void {
    components.forEach(c => this.register(c.type, c.component, c.useSuspense, c.loader, c.variant, c.isClient))
  }

  /**
   * @inheritDoc
   */
  public has(type: ComponentTypeHandle, variant: string = this.defaultVariant): boolean {
    const registryKey = this.processComponentTypeHandle(type, variant)
    const result = this._get(type, variant) !== undefined
    if (this.dbg) 
      console.log(`🔎 [DefaultComponentFactory] Checking for ${ registryKey } - ${ result ? 'YES' : 'NO'}`)
    return result
  }

  /**
   * @inheritDoc
   */
  public resolve(type: ComponentTypeHandle, variant: string = this.defaultVariant): undefined | ComponentType {
    const { entry, key: registryKey } = this._get(type, variant) ?? { entry: undefined, key: this.processComponentTypeHandle(type, variant) }

    if (!entry) {
      if (this.dbg)
        console.warn(
          `❌ [DefaultComponentFactory] Unable to resolve ${registryKey}, this will prevent the item from rendering`
        )
      return undefined // The key is not registered in the factory
    }

    if (this.dbg)
      console.log(`🔎 [DefaultComponentFactory] Resolved component for ${ registryKey }. (Suspense: ${ entry.useSuspense ? 'yes' : 'no' }); Variant: ${ entry.variant ?? this.defaultVariant }`)

    // Client Components cannot receive the (class based) context from a Server Component
    const EntryComponent = entry.isClient ? createClientBoundary(entry.component) : entry.component
    if (entry.useSuspense != true) return EntryComponent // There's no suspense, so we're using the component directly

    // We need to wrap the component in a Supense
    const EntryLoader = entry.loader
    function Suspended(props: object) {
      return (
        <Suspense fallback={EntryLoader && <EntryLoader {...props} />}>
          <EntryComponent {...props} />
        </Suspense>
      )
    }
    return Suspended
  }

  /**
   * Find the registry entry for the type, using the lookup keys in order of
   * preference
   *
   * @param     type      The type to find the entry for
   * @param     variant   The variant to find the entry for
   * @returns   The first matching entry and the key it was found with, or
   *            `undefined` if there is no match
   */
  private _get(type: ComponentTypeHandle, variant: string): { entry: ComponentTypeDictionaryEntry, key: string } | undefined {
    const lookupKeys = this.withFallback ? this.processComponentTypeHandleForLookup(type, variant) : [this.processComponentTypeHandle(type, variant)]
    for (const key of lookupKeys) {
      const entry = this.registry.get(key)
      if (entry) return { entry, key }
    }
    return undefined
  }

  /**
   * @inheritDoc
   */
  public extract(): ComponentTypeDictionary {
    return Array.from(this.registry.entries()).map(([key, entry]) => {
      return { ...entry, type: key }
    })
  }

  /**
   * @inheritDoc
   */
  public remove(type: ComponentTypeHandle) {
    const registryKey = this.processComponentTypeHandle(type)
    if (this.dbg)
      console.log(`🔎 [DefaultComponentFactory] Removing ${registryKey}`)
    if (!this.registry.has(registryKey)) return true
    return this.registry.delete(registryKey)
  }

  /**
   * Process the component variant handle into 
   * 
   * @param handle 
   * @param variant 
   * @returns 
   */
  private processComponentTypeHandle(handle: ComponentTypeHandle, variant?: string): string {
    const handleToProcess = typeof handle === 'string' ? handle.split(MERGE_SYMBOL) : [...handle];
    if (Array.isArray(handleToProcess) && handleToProcess.every((s) => typeof s === 'string')) {
      
      const offset = (
        ['component','page','experience'].includes(handleToProcess.at(handleToProcess.length - 3)?.toLowerCase()??'') && 
        !['row','column','section','experience','media'].includes(handleToProcess.at(handleToProcess.length - 2)?.toLowerCase()??'')
      ) ? 1 : 0

      const typeName = handleToProcess.at(handleToProcess.length - (1+offset))
      const prefix = handleToProcess.at(handleToProcess.length - (2+offset)) === 'RichText' ? 'RichText/' : '' 
      const actualVariant = offset > 0 ? handleToProcess.at(handleToProcess.length - 1) ?? variant ?? 'default' : variant ?? 'default'
      const newHandle = prefix + typeName + '/' + actualVariant

      return newHandle
    }
    throw new Error(`Invalid component type handle: ${typeof handle}`)
  }

  /**
   * Create the registry keys to look for, ordered from the most to the least
   * preferred. The `ignoredContracts` are removed from the handle first, after
   * which each remaining part - the last part being the most specific one - is
   * tried on its own and combined with the parts that follow it.
   *
   * @param     handle    The type handle to look up
   * @param     variant   The variant to look up
   * @returns   The registry keys, in order of preference
   */
  private processComponentTypeHandleForLookup(handle: ComponentTypeHandle, variant: string): string[] {
    const handleToProcess = typeof handle === 'string' ? handle.split(MERGE_SYMBOL) : [...handle]
    if (Array.isArray(handleToProcess) && handleToProcess.every((s) => typeof s === 'string')) {
      const parts = handleToProcess.filter((s) => !this.ignoredContracts.includes(s.toLowerCase()))
      const keys = parts.flatMap((part, index) => {
        const combined = parts.slice(index).join(MERGE_SYMBOL)
        const keysForPart = [part + MERGE_SYMBOL + variant, combined + MERGE_SYMBOL + variant]
        if (variant === this.defaultVariant)
          keysForPart.push(part, combined)
        return keysForPart.filter((key, idx, all) => all.indexOf(key) === idx)
      })
      return keys.reverse()
    }
    throw new Error(`Invalid component type handle: ${typeof handle}`)
  }
}

/**
 * Wrap a Client Component so it can be rendered by a Server Component with the
 * regular props. The `ctx` and `editProps.ctx` props are replaced by their
 * serializable form, as React does not allow class instances to cross the
 * Server/Client boundary.
 *
 * @param     component   The Client Component to wrap
 * @returns   The wrapped component
 */
function createClientBoundary(component: ComponentType): ComponentType {
  const cached = clientBoundaries.get(component)
  if (cached) return cached
  const Target = component as React.ComponentType<Record<string, unknown>>
  const ClientBoundary = (props: Record<string, unknown>) => {
    const { ctx, editProps, ...rest } = props
    const editPropsObj = editProps as Record<string, unknown> | undefined
    return <Target
      {...rest}
      {...(ctx !== undefined ? { ctx: toSerializableContext(ctx) } : {})}
      {...(editPropsObj ? { editProps: { ...editPropsObj, ...(editPropsObj.ctx !== undefined ? { ctx: toSerializableContext(editPropsObj.ctx) } : {}) } } : {})}
    />
  }
  ClientBoundary.displayName = `ClientBoundary(${ (component as { displayName?: string }).displayName ?? 'Component' })`
  clientBoundaries.set(component, ClientBoundary)
  return ClientBoundary
}
