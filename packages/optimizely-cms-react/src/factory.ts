import type { ComponentFactory, ComponentType, ComponentTypeHandle, ComponentTypeDictionary } from './types.js'
const MERGE_SYMBOL = '/'

export const EmptyComponentHandle =  '$$fragment$$'

/**
 * The default implementation of the ComponentFactory interface, which works both
 * client and server side.
 */
export class DefaultComponentFactory implements ComponentFactory {
    private registry : { [typeName: string]: ComponentType } = {}
    private dbg : boolean

    /**
     * Create a new instance of the DefaultComponentFactory
     * 
     * @param   initialComponents   If provided, this dictionary will be registered
     *                              with the factory.
     */
    public constructor(initialComponents?: ComponentTypeDictionary) 
    {
        this.dbg = process.env.OPTIMIZELY_DEBUG == '1'
        if (initialComponents)
            this.registerAll(initialComponents)
    }

    register(type: ComponentTypeHandle, component: ComponentType) : void
    {
        type = processComponentTypeHandle(type)
        if (this.dbg) console.log(`➕ [DefaultComponentFactory] Adding ${ type }`)
        this.registry[type] = component
    }

    registerAll(components: ComponentTypeDictionary) : void 
    {
        components.forEach(c => this.register(c.type, c.component))
    }

    has(type: ComponentTypeHandle) : boolean
    {
        type = processComponentTypeHandle(type)
        if (this.dbg) console.log(`🔎 [DefaultComponentFactory] Checking for ${ type }`)
        return Object.getOwnPropertyNames(this.registry).includes(type)
    }

    resolve(type: ComponentTypeHandle) : undefined | ComponentType 
    {
        type = processComponentTypeHandle(type)
        if (this.dbg) console.log(`⚡ [DefaultComponentFactory] Resolving ${ type }`)
        if (Object.getOwnPropertyNames(this.registry).includes(type))
            return this.registry[type]
        return undefined
    }

    extract() : ComponentTypeDictionary
    {
        const extracted : ComponentTypeDictionary = []
        Object.getOwnPropertyNames(this.registry).map(typeKey => {
            extracted.push({
                type: typeKey,
                component: this.registry[typeKey]
            })
        })
        return extracted
    }
}

function processComponentTypeHandle(handle: ComponentTypeHandle) : string
{
    if (typeof(handle) == 'string')
        return handle == "" ? EmptyComponentHandle : handle
    if (Array.isArray(handle) && handle.every(s => typeof(s) == 'string'))
        return handle
            .map(s => s.startsWith("_") ? s.substring(1) : s)   // Remove all leading underscores
            .filter(s => s.toLowerCase() != 'content')          // Remove the "Content" base type
            .map(s => s == "" ? EmptyComponentHandle : s)       // Fall back to a fragment
            .join(MERGE_SYMBOL)                                 // Types are processed as a string
    throw new Error(`Invalid component type handle: ${ typeof(handle) }`)
}

const _static : { factory ?: ComponentFactory } = {}

/**
 * Retrieve the currently staticly cached ComponentFactory instance, if there's no
 * currently staticly cached ComponentFactory, the default ComponentFactory will be
 * returned
 * 
 * @returns The ComponentFactory
 */
export const getFactory : () => ComponentFactory = () => {
    const DBG = process.env.OPTIMIZELY_DEBUG == '1'
    if (!_static.factory) {
        if (DBG) console.log("⚪ [ComponentFactory] Creating new Component Factory")
        _static.factory = new DefaultComponentFactory()
    } else {
        if (DBG) console.log("⚪ [ComponentFactory] Reusing existing Component Factory")
    }
    return _static.factory
}
/**
 * Update the staticly cached Component Factory, which will be returned by all future 
 * "getFactory" calls
 * 
 * @param   newFactory    The ComponentFactory to set as staticly cached instance
 * @returns void
 */
export const setFactory : (newFactory: ComponentFactory) => void = (newFactory: ComponentFactory) => {
    _static.factory = newFactory
}
export default getFactory()