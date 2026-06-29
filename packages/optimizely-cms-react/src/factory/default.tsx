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
  private withFallback: boolean

  /**
   * A list of interfaces to ignore when resolving components. Adjust this
   * list if you're experiencing issues with resolving components due to 
   * contracts. Values **must be** provided lowercase and without leading 
   * underscore. For example `_Item` must be provided as `item`.
   * 
   * The default value includes the common ones for SaaS CMS.
   */
  public readonly ignoredContracts: string[] = ['item','assetitem','imageitem','content'];

  public readonly defaultVariant: string = 'default';

  /**
   * Create a new instance of the DefaultComponentFactory
   *
   * @param   initialComponents   If provided, this dictionary will be registered
   *                              with the factory.
   */
  public constructor(initialComponents?: ComponentTypeDictionary, withFallback: boolean = true) {
    // Set the fallback behavior
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

  public register(
    type: ComponentTypeHandle,
    component: ComponentType,
    useSuspense: boolean = false,
    loader?: ComponentType,
    variant: string = this.defaultVariant
  ): void {
    const registryKey = this.processComponentTypeHandle(type, variant)
    if (this.dbg)
      console.log(`➕ [DefaultComponentFactory] Registering ${registryKey}`)
    this.registry.set(registryKey, { type: registryKey, component, useSuspense, loader, variant })
  }

  public registerAll(components: ComponentTypeDictionary): void {
    components.forEach(c => this.register(c.type, c.component, c.useSuspense, c.loader, c.variant))
  }

  public has(type: ComponentTypeHandle, variant: string = this.defaultVariant): boolean {
    const registryKey = this.processComponentTypeHandle(type, variant)
    const result = this._has(type, variant);
    if (this.dbg) 
      console.log(`🔎 [DefaultComponentFactory] Checking for ${ registryKey } - ${ result ? 'YES' : 'NO'}`)
    return result
  }

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
      console.log(`🔎 [DefaultComponentFactory] Resolved component for ${ registryKey }. (Suspense: ${entry.useSuspense ? 
    `yes${ entry.loader ? ' (with custom loading state)': ' (blank while loading)' }` : 
    'no'}); Variant: ${ entry.variant ?? this.defaultVariant }`)

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

  private _get(type: ComponentTypeHandle, variant?: string) {
    const registryKey = this.processComponentTypeHandleForLookup(type, variant);
    for (let idx = 0; idx < registryKey.length; idx++) {
      const entry = this.registry.get(registryKey[idx]);
      if (entry) return { entry: entry, key: registryKey[idx] }
    }
    return undefined
  }

  private _has(type: ComponentTypeHandle, variant?: string): boolean {
    const registryKey = this.processComponentTypeHandleForLookup(type, variant);
    for (let idx = 0; idx < registryKey.length; idx++) {
      if (this.registry.has(registryKey[idx])) {
        return true
      }
    }
    return false
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
      const actualVariant = offset > 0 ? handleToProcess.at(handleToProcess.length - 1) ?? variant ?? this.defaultVariant : variant ?? this.defaultVariant
      const newHandle = prefix + typeName + '/' + actualVariant

      return newHandle
    }
    throw new Error(`Invalid component type handle: ${typeof handle}`)
  }

  private processComponentTypeHandleForLookup(handle: ComponentTypeHandle, variant?: string): string[] {
    let handleToProcess = typeof handle === 'string' ? handle.split(MERGE_SYMBOL) : [...handle];
    if (Array.isArray(handleToProcess) && handleToProcess.every((s) => typeof s === 'string')) {

      // First remove ignored contracts from the handle, as they are not relevant for the lookup
      handleToProcess = handleToProcess.filter((s) => !this.ignoredContracts.includes(s.toLowerCase()));

      // Now build the lookup keys based on the remaining handle parts
      const list = handleToProcess.flatMap((s, index) => {
        const subList = [
          s + (variant ? '/' + variant : ''),
          handleToProcess.slice(index).join('/') + (variant ? '/' + variant : '')
        ];
        if (variant === this.defaultVariant) {
          subList.push(s, handleToProcess.slice(index).join('/'));
        }
        return subList.filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
      });
      return list.reverse() // Reverse to prioritize more specific keys first;
    }
    throw new Error(`Invalid component type handle: ${typeof handle}`);
  }
}
