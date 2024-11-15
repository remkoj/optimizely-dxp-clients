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
     * Check if the component type has been registered within the factory
     * 
     * @param       type            The component type to check for
     * @returns     Whether or not the type exists within the factory
     */
    has(type: ComponentTypeHandle) : boolean

    /**
     * Register an individual component
     * 
     * @param       type            The component type to register
     * @param       component       The component to bind to the type
     * @param       useSuspense     If set to 'true' the registered component will be wrapped in <Suspense />
     * @param       loader          The component to use as "loading" state by the <Suspense />
     */
    register(type: ComponentTypeHandle, component: ComponentType, useSuspense?: boolean, loader?: ComponentType) : void

    /**
     * Register all components provided through the dictionary
     * 
     * @param       components  The components to register
     */
    registerAll(components: ComponentTypeDictionary) : void

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