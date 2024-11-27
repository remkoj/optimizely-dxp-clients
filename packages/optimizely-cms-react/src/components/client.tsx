'use client'

import { type ComponentType } from 'react'
import { useOptimizelyCms } from '../context/client.js'
import { type PropsWithContext } from '../context/types.js'
import { cmsContentAware } from './cms-content/utils.js'

import { CmsContentArea as BaseContentArea, type CmsContentAreaComponent } from './cms-content-area/index.js' // Both RSC & Client capable
import { CmsEditable as BaseEditable, type CmsEditableComponent } from './cms-editable/index.js' // Both RSC & Client capable
import { CmsContent as BaseCmsContent, type CmsContentComponent } from './cms-content/client.js' // Different components for RSC & Client
import { OptimizelyComposition as BaseOptimizelyComposition, type OptimizelyCompositionComponent } from './visual-builder/index.js' // Both RSC & Client capable
import { RichText as BaseRichText, type RichTextComponent } from './rich-text/index.js'

// Pass through Style functions types
export type { BaseStyleDefinition, ElementStyleDefinition, LayoutProps, LayoutPropsSetting, LayoutPropsSettingChoices, LayoutPropsSettingKeys, LayoutPropsSettingValues, NodeStyleDefinition, StyleDefinition, StyleSetting } from "./cms-styles/index.js"
export { extractSettings, readSetting } from "./cms-styles/index.js"

// Export dictionary
export { DefaultComponents as RichTextComponentDictionary } from './rich-text/components.js' 

/**
 * Wrapper function to turn context dependant components into easy to use 
 * client components
 * 
 * @param       component       The component where the `ctx` parameter must be fulfilled
 * @returns     The component, without CTX parameter
 */
export function clientContextAware<P = any>(component: ComponentType<PropsWithContext<P>>) : ComponentType<P>
{
    const BaseComponent = component
    const ClientContextInjector = (props: P) => {
        const ctx = useOptimizelyCms()
        return <BaseComponent ctx={ctx} { ...props } />
    }
    return ClientContextInjector
}

/**
 * Client side Optimizely CMS Editable 
 */
export const CmsEditable = clientContextAware(BaseEditable) as CmsEditableComponent


/**
 * Client side Optimizely CMS Content, leveraging the CMS Context to load the
 * content type and content data when needed
 */
export const CmsContent = clientContextAware(BaseCmsContent) as CmsContentComponent
export type { CmsContentComponent, CmsContentProps } from "./cms-content/client.js"

/**
 * Client side Optimizely CMS Content Area, leveraging the CMS Context to infer
 * the connection to Optimizely Graph and component dictionary.
 */
export const CmsContentArea = cmsContentAware(clientContextAware(BaseContentArea), CmsContent) as CmsContentAreaComponent
export type { CmsContentAreaClassMapper, CmsContentAreaComponent, CmsContentAreaProps, ContentAreaItemDefinition } from "./cms-content-area/index.js"

/**
 * Client side Optimizely Composition (e.g. Visual Builder), leveraging the CMS
 * Context to infer the connection to Optimizely Graph and component 
 * dictionary.
 */
export const OptimizelyComposition = cmsContentAware(clientContextAware(BaseOptimizelyComposition), CmsContent) as OptimizelyCompositionComponent

/**
 * Client side renderer for Rich Text
 */
export const RichText = BaseRichText as RichTextComponent