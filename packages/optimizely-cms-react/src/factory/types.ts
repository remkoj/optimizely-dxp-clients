import type { ComponentType as ReactComponentType, ExoticComponent as ReactExoticComponent } from "react"

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
    has(type: ComponentTypeHandle) : boolean

    /**
     * Register an individual component. When the component type has already
     * been registered it will be updated.
     * 
     * @param       type            The component type to register
     * @param       component       The component to bind to the type
     * @param       useSuspense     If set to 'true' the registered component will be wrapped in <Suspense />
     * @param       loader          The component to use as "loading" state by the <Suspense />
     */
    register(type: ComponentTypeHandle, component: ComponentType, useSuspense?: boolean, loader?: ComponentType) : void

    /**
     * Register all components provided through the dictionary. When the 
     * component type has already been registered it will be updated.
     * 
     * @param       components  The components to register
     */
    registerAll(components: ComponentTypeDictionary) : void

    /**
     * Allows removing of a component type from the factory, but only when
     * the implemenation supports it.
     * 
     * @param       type            The component type to remove
     * @returns     `true` If the component was not found or removed, `false`
     *              otherwise
     */
    remove?: (type: ComponentTypeHandle) => boolean

    /**
     * Resolve a component type
     * 
     * @param       type    The type to search the component for
     * @returns     The component that was resolved for the provided type
     */
    resolve(type: ComponentTypeHandle) : ComponentType | undefined

    /**
     * Retrieve the registered components as a dictionary that can be used to
     * be imported in a new instance.
     * 
     * @returns     The dictionary
     */
    extract() : ComponentTypeDictionary
}
