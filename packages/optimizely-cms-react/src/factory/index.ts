import { type ComponentFactory } from "./types.js"
import { DefaultComponentFactory, MERGE_SYMBOL } from "./default.js"

export type * from "./types.js"
export { DefaultComponentFactory } from "./default.js"

/**
 * The default merge symbol to use when converting between an array based
 * ComponentTypeHandle and strig based ComponentTypeHandle
 */
export const TYPE_MERGE_SYMBOL = MERGE_SYMBOL

/**
 * Create a new instance of the included DefaultComponentFactory, which should 
 * be wrapped in a form of caching provided by your project.
 * 
 * @returns The ComponentFactory
 */
export const getFactory : () => ComponentFactory = () => {
    const DBG = process.env.OPTIMIZELY_DEBUG == '1'
    if (DBG) console.log("⚪ [ComponentFactory] Creating new Component Factory")
    return new DefaultComponentFactory()
}

export default getFactory()