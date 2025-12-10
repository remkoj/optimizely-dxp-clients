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
    loader?: ComponentType
  ): void {
    const registryKey = this.processComponentTypeHandle(type)
    if (this.dbg)
      console.log(`➕ [DefaultComponentFactory] Registering ${registryKey}`)
    this.registry.set(registryKey, { type, component, useSuspense, loader })
  }

  public registerAll(components: ComponentTypeDictionary): void {
    components.forEach((c) => {
      const registryKey = this.processComponentTypeHandle(c.type)
      if (this.dbg)
        console.log(`➕ [DefaultComponentFactory] Registering ${registryKey}`)
      this.registry.set(registryKey, c)
    })
  }

  public has(type: ComponentTypeHandle): boolean {
    const registryKey = this.processComponentTypeHandle(type)
    //if (this.dbg) console.log(`🔎 [DefaultComponentFactory] Checking for ${ registryKey }`)
    return this.registry.has(registryKey)
  }

  public resolve(type: ComponentTypeHandle): undefined | ComponentType {
    const registryKey = this.processComponentTypeHandle(type)

    const entry = this.registry.get(registryKey)
    if (!entry) {
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

  private processComponentTypeHandle(handle: ComponentTypeHandle): string {
    let handleToProcess = typeof handle === 'string' ? handle.split(MERGE_SYMBOL) : handle;
    if (Array.isArray(handleToProcess) && handleToProcess.every((s) => typeof s === 'string'))
      return handleToProcess
        .map((s) => s === '' ? EmptyComponentHandle : (s.startsWith('_') ? s.substring(1) : s)) // Remove all leading underscores
        .filter((s) => !this.ignoredContracts.includes(s.toLocaleLowerCase()))
        .join(MERGE_SYMBOL)
    throw new Error(`Invalid component type handle: ${typeof handle}`)
  }
}
