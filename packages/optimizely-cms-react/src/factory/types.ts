import type { ComponentType as ReactComponentType, ExoticComponent as ReactExoticComponent, JSX } from "react"

/**
 * Basic Component Type descriptor for the Component Factory
 */
export type ComponentType = (ReactComponentType<any>) | (ReactExoticComponent<any>) | (keyof JSX.IntrinsicElements)

/**
 * 
 */
export type ComponentTypeHandle = string | string[]

export type ComponentTypeDictionary = Array<ComponentTypeDictionaryEntry>

export type ComponentTypeDictionaryEntry = {
  /**
   * The component type to register
   */
  type: ComponentTypeHandle,

  /**
   * The component to bind to the type
   */
  component: ComponentType,

  /**
   * If set to 'true' the registered component will be wrapped in <Suspense />
   */
  useSuspense?: boolean

  /**
   * The component to use as "loading" state by the <Suspense />
   */
  loader?: ComponentType

  /**
   * Used for the loading of a specific variant of the component (for example 'header', 'footer', 'menu')
   */
  variant?: string
}

/**
 * Component Factory
 */
export interface ComponentFactory {
  /**
   * A list of interfaces to ignore when resolving components. Adjust this
   * list if you're experiencing issues with resolving components due to 
   * contracts. Values **must be** provided lowercase and without leading 
   * underscore. For example `_Item` must be provided as `item`.
   * 
   * The default value includes the common ones for SaaS CMS.
   */
  ignoredContracts: string[];
  
  /**
   * Check if the component type has been registered within the factory
   * 
   * @param       type            The component type to check for
   * @returns     Whether or not the type exists within the factory
   */
  has(type: ComponentTypeHandle): boolean

  /**
   * Check if the component type has been registered within the factory
   * 
   * @param       type            The component type to check for
   * @returns     Whether or not the type exists within the factory
   */
  has(type: ComponentTypeHandle, variant?: string) : boolean

  /**
   * Register an individual component. When the component type has already
   * been registered it will be updated.
   * 
   * @param       type            The component type to register
   * @param       component       The component to bind to the type
   * @param       useSuspense     If set to 'true' the registered component will be wrapped in <Suspense />
   * @param       loader          The component to use as "loading" state by the <Suspense />
   * @param       variant         The specific variant of the component (for example 'header', 'footer', 'menu')
   */
  register(type: ComponentTypeHandle, component: ComponentType, useSuspense?: boolean, loader?: ComponentType, variant?: string) : void

  /**
   * Perform a batch registration of a collection of components. Each item will be extracted and registered
   * through the register function.
   * 
   * @param     components      The components to register
   */
  registerAll(components: ComponentTypeDictionary): void

  /**
   * Allows removing of a component type from the factory, but only when
   * the implemenation supports it.
   * 
   * @param       type            The component type to remove
   * @param       variant         The variant of the component type, will remove all if not specified
   * @returns     `true` If the component was not found or removed, `false`
   *              otherwise
   */
  remove?: (type: ComponentTypeHandle, variant?: string) => boolean

  /**
   * Resolve a component type
   * 
   * @param       type    The type to search the component for
   * @returns     The component that was resolved for the provided type
   */
  resolve(type: ComponentTypeHandle, variant?: string) : ComponentType | undefined

  /**
   * Retrieve the registered components as a dictionary that can be used to
   * be imported in a new instance.
   * 
   * @returns     The dictionary
   */
  extract() : ComponentTypeDictionary
}
