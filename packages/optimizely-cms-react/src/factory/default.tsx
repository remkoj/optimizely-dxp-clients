import type {
  ComponentFactory,
  ComponentType,
  ComponentTypeHandle,
  ComponentTypeDictionary,
  ComponentTypeDictionaryEntry,
} from './types.js'
import { Suspense } from 'react'

export const MERGE_SYMBOL = '/'

export const EmptyComponentHandle = '$$fragment$$'

/**
 * The default implementation of the ComponentFactory interface, which works both
 * client and server side.
 */
export class DefaultComponentFactory implements ComponentFactory {
  private registry = new Map<string, ComponentTypeDictionaryEntry>()
  private dbg: boolean

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
   * Create a new instance of the DefaultComponentFactory
   *
   * @param   initialComponents   If provided, this dictionary will be registered
   *                              with the factory.
   */
  public constructor(initialComponents?: ComponentTypeDictionary) {
    // Resolve debug mode
    try {
      this.dbg = process.env.OPTIMIZELY_DEBUG == '1'
    } catch {
      this.dbg = false
    }

    // Add provided default dictionary
    if (initialComponents) this.registerAll(initialComponents)
  }

  public register(
    type: ComponentTypeHandle,
    component: ComponentType,
    useSuspense: boolean = false,
    loader?: ComponentType,
    variant: string = 'default'
  ): void {
    const registryKey = this.processComponentTypeHandle(type, variant)
    this.registry.set(registryKey, { type: registryKey, component, useSuspense, loader, variant })
  }

  public registerAll(components: ComponentTypeDictionary): void {
    components.forEach(c => this.register(c.type, c.component, c.useSuspense, c.loader, c.variant))
  }

  public has(type: ComponentTypeHandle, variant: string = 'default'): boolean {
    const registryKey = this.processComponentTypeHandle(type, variant)
    if (this.dbg) 
      console.log(`🔎 [DefaultComponentFactory] Checking for ${ registryKey } - ${ this.registry.has(registryKey) ? 'YES' : 'NO'}`)
    return this.registry.has(registryKey)
  }

  public resolve(type: ComponentTypeHandle, variant: string = 'default'): undefined | ComponentType {
    const registryKey = this.processComponentTypeHandle(type, variant)

    const entry = this.registry.get(registryKey)
    if (!entry) {
      if (this.dbg)
        console.warn(
          `❌ [DefaultComponentFactory] Unable to resolve ${registryKey}, this will prevent the item from rendering`
        )
      return undefined // The key is not registered in the factory
    }
    if (entry.useSuspense != true) return entry.component // There's no suspense, so we're using the component directly

    // We need to wrap the component in a Supense
    const EntryComponent = entry.component
    const EntryLoader = entry.loader
    function Suspended(props: Record<string, any>) {
      return (
        <Suspense fallback={EntryLoader && <EntryLoader {...props} />}>
          <EntryComponent {...props} />
        </Suspense>
      )
    }
    return Suspended
  }

  public extract(): ComponentTypeDictionary {
    return Array.from(this.registry.entries()).map(([key, entry]) => {
      return { ...entry, type: key }
    })
  }

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
    let handleToProcess = typeof handle === 'string' ? handle.split(MERGE_SYMBOL) : [...handle];
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
}
