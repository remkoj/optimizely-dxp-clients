import "server-only"
import { type ReactNode, type ComponentType } from 'react'
import { type PropsWithContext } from '../context/types.js'
import { getServerContext } from '../context/rsc.js'
import { cmsContentAware } from './cms-content/utils.js'

import { CmsContentArea as BaseContentArea, type CmsContentAreaComponent } from './cms-content-area/index.js' // Both RSC & Client capable
import { CmsEditable as BaseEditable, type CmsEditableComponent } from './cms-editable/index.js' // Both RSC & Client capable
import { CmsContent as BaseCmsContent, type CmsContentComponent, type CmsContentBaseComponent } from './cms-content/rsc.js' // Different components for RSC & Client
import { OptimizelyComposition as BaseOptimizelyComposition, type OptimizelyCompositionComponent } from './visual-builder/index.js' // Both RSC & Client capable
import { RichText as BaseRichText, type RichTextComponent } from './rich-text/index.js'

// Pass through Style functions types
export * from "./cms-styles/index.js"
export { isNode, isElementNode, isElementNodeOfType, isStructureNode } from "./visual-builder/functions.js"

// Export dictionary
export { DefaultComponents as RichTextComponentDictionary } from './rich-text/components.js' 

/**
 *  Fallback while RSC hasn't been moved from Canary to Main
 */
type ReactServerComponentType<P = any> = ComponentType<P> | ((props: P) => Promise<ReactNode>)

/**
 * Wrapper function to turn context dependant components into easy to use 
 * server components
 * 
 * @param       component       The component where the `ctx` parameter must be fulfilled
 * @returns     The component, without CTX parameter
 */
export function serverContextAware<P = any>(component: ReactServerComponentType<PropsWithContext<P>>) : ComponentType<P>
{
    const BaseComponent = component as ComponentType<PropsWithContext<P>>
    const ServerContextInjector : ComponentType<P> = (props: P) => {
        const ctx = getServerContext()
        return <BaseComponent ctx={ctx} { ...props } />
    }
    ServerContextInjector.displayName = "Server Context Injector"
    return ServerContextInjector
}

/**
 * Client side Optimizely CMS Editable 
 */
export const CmsEditable = serverContextAware(BaseEditable) as CmsEditableComponent


/**
 * Client side Optimizely CMS Content, leveraging the CMS Context to load the
 * content type and content data when needed
 */
export const CmsContent = serverContextAware(BaseCmsContent as unknown as CmsContentBaseComponent) as CmsContentComponent
export type { CmsContentComponent, CmsContentProps } from "./cms-content/rsc.js"

/**
 * Client side Optimizely CMS Content Area, leveraging the CMS Context to infer
 * the connection to Optimizely Graph and component dictionary.
 */
export const CmsContentArea = cmsContentAware(serverContextAware(BaseContentArea), CmsContent) as CmsContentAreaComponent
export type { CmsContentAreaClassMapper, CmsContentAreaComponent, CmsContentAreaProps, ContentAreaItemDefinition } from "./cms-content-area/index.js"

/**
 * Client side Optimizely Composition (e.g. Visual Builder), leveraging the CMS
 * Context to infer the connection to Optimizely Graph and component 
 * dictionary.
 */
export const OptimizelyComposition = cmsContentAware(serverContextAware(BaseOptimizelyComposition), CmsContent) as OptimizelyCompositionComponent

/**
 * Client side renderer for Rich Text
 */
export const RichText = BaseRichText as RichTextComponent