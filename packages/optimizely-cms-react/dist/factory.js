const MERGE_SYMBOL = '/';
export const EmptyComponentHandle = '$$fragment$$';
/**
 * The default implementation of the ComponentFactory iterface
 */
export class DefaultComponentFactory {
    constructor() {
        this.registry = {};
        this.dbg = process.env.OPTIMIZELY_DEBUG == '1';
    }
    register(type, component) {
        type = processComponentTypeHandle(type);
        if (this.dbg)
            console.log(`➕ [DefaultComponentFactory] Adding ${type}`);
        this.registry[type] = component;
    }
    registerAll(components) {
        components.forEach(c => this.register(c.type, c.component));
    }
    has(type) {
        type = processComponentTypeHandle(type);
        if (this.dbg)
            console.log(`🔎 [DefaultComponentFactory] Checking for ${type}`);
        return Object.getOwnPropertyNames(this.registry).includes(type);
    }
    resolve(type) {
        type = processComponentTypeHandle(type);
        if (this.dbg)
            console.log(`⚡ [DefaultComponentFactory] Resolving ${type}`);
        if (Object.getOwnPropertyNames(this.registry).includes(type))
            return this.registry[type];
        return undefined;
    }
}
function processComponentTypeHandle(handle) {
    if (typeof (handle) == 'string')
        return handle == "" ? EmptyComponentHandle : handle;
    if (Array.isArray(handle) && handle.every(s => typeof (s) == 'string'))
        return handle.map(s => s.startsWith("_") ? s.substring(1) : s).filter(s => s.toLowerCase() != 'content').map(s => s == "" ? EmptyComponentHandle : s).join(MERGE_SYMBOL);
    throw new Error(`Invalid component type handle: ${typeof (handle)}`);
}
const _static = {};
/**
 * Retrieve the currently staticly cached ComponentFactory instance, if there's no
 * currently staticly cached ComponentFactory, the default ComponentFactory will be
 * returned
 *
 * @returns The ComponentFactory
 */
export const getFactory = () => {
    const DBG = process.env.OPTIMIZELY_DEBUG == '1';
    if (!_static.factory) {
        if (DBG)
            console.log("⚪ [ComponentFactory] Creating new Component Factory");
        _static.factory = new DefaultComponentFactory();
    }
    else {
        if (DBG)
            console.log("⚪ [ComponentFactory] Reusing existing Component Factory");
    }
    return _static.factory;
};
/**
 * Update the staticly cached Component Factory, which will be returned by all future
 * "getFactory" calls
 *
 * @param   newFactory    The ComponentFactory to set as staticly cached instance
 * @returns void
 */
export const setFactory = (newFactory) => {
    _static.factory = newFactory;
};
export default getFactory();
//# sourceMappingURL=factory.js.map