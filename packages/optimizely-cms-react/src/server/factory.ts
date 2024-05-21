import 'server-only'
import React from 'react'
import type * as Types from '../types.js'
import { DefaultComponentFactory as DefaultFactory } from '../factory.js'
import isDebug from './is-debug.js'

export type { ComponentFactory } from '../types.js'
export { DefaultComponentFactory } from '../factory.js'

/**
 * Retrieve the working instance of the component factory, which is memoized through the React.cache()
 * server side react method
 */
//@ts-expect-error  React.cache is a canary function, not yet always properly resolved by TypeScript
export const getFactory : () => Types.ComponentFactory = React.cache(() => {
    const factory = new DefaultFactory()
    if (isDebug())
        console.log('⚪ [ComponentFactory] Created new DefaultComponentFactory (RSC)')
    return factory
})

export default getFactory