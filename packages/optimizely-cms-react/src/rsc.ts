/**
 * The version of the current Optimizely DXP React SDK
 */
import buildInfo from "./version.json" with { type: "json" }
export const Version = buildInfo.version

// Export library
export * as Errors from './errors.js'
export * as Utils from './utilities.js'
export * from './types.js'
export * from './factory/index.js'
export * from './context/types.js'

// Export React Server Components
export * from './context/rsc.js'
export * from './components/rsc.js'
export * from './components/rsc-components.js'
export * from './rsc-utilities.js'