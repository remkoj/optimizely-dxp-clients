/**
 * The version of the current Optimizely DXP React SDK
 */
export const Version = '3.1.0'

// Export library
export * as Errors from './errors.js'
export * as Utils from './utilities.js'
export * from './types.js'
export * from './factory/index.js'

// Export React Server Components
export * from './context/rsc.js'
export * from './components/rsc.js'
export * from './rsc-utilities.js'