'use client'

// Import types & helpers
import type { ComponentType, FunctionComponent } from 'react'
import type { PropsWithContext, WithContextFunction, PropsWithCrossBoundaryContext } from '../context/types.js'
import { isTransferrableContext, isGenericContext } from '../context/shared.js'
import { useOptimizelyCms, ClientContext } from '../context/client.js'
import { withCmsContent } from './cms-content/utils.js'

// Import Base components and their types
import { CmsContentArea as BaseContentArea, type CmsContentAreaComponent } from './cms-content-area/index.js' // Both RSC & Client capable
import { CmsEditable as BaseEditable, type CmsEditableComponent } from './cms-editable/index.js' // Both RSC & Client capable
import { CmsContent as BaseCmsContent, type CmsContentComponent } from './cms-content/client.js' // Different components for RSC & Client
import { OptimizelyComposition as BaseOptimizelyComposition, type OptimizelyCompositionComponent } from './visual-builder/index.js' // Both RSC & Client capable
import { RichText as BaseRichText, type RichTextComponent } from './rich-text/index.js'

// Import Base Rich-Text components
import { isNullOrUndefined } from '../utilities.js'

// Pass through Style functions types
export type { BaseStyleDefinition, ElementStyleDefinition, LayoutProps, LayoutPropsSetting, LayoutPropsSettingChoices, LayoutPropsSettingKeys, LayoutPropsSettingValues, NodeStyleDefinition, StyleDefinition, StyleSetting } from "./cms-styles/index.js"
export { isNode, isElementNode, isComponentNode, isComponentNodeOfType, isStructureNode } from "./visual-builder/functions.js"
export { extractSettings, readSetting } from "./cms-styles/index.js"

/**
 * Wrapper function to turn context dependant components into easy to use 
 * client components
 * 
 * @param       component       The component where the `ctx` parameter must be fulfilled
 * @returns     The component, with an optional `ctx` parameter that will be filled from 
 *              the context if not provided
 */
export const withContext: WithContextFunction = <
  P = object
>(component: ComponentType<PropsWithContext<P>>) =>
{
  const BaseComponent = component;
  const ClientContextInjector: FunctionComponent<PropsWithCrossBoundaryContext<P>> = ({ ctx, ...props }) => {
    const { components } = useOptimizelyCms();
    if (isNullOrUndefined(ctx) || isTransferrableContext(ctx)) {
      const context = new ClientContext(ctx, components);
      return <BaseComponent { ...(props as P) } ctx={context} />;
    } else if (isGenericContext(ctx))
      return <BaseComponent { ...(props as P) } ctx={ctx} />;
    else {
      console.error(
        `🔴 [Client][withContext] Context for context aware component ${BaseComponent.displayName ?? BaseComponent.name ?? '[ANONYMOUS]'} is invalid!`
      )
      throw new Error(
        `Client withContext: Context for context aware component ${BaseComponent.displayName ?? BaseComponent.name ?? '[ANONYMOUS]'} is invalid!`
      )
    }
  }
  return ClientContextInjector;
}

/**
 * Client side renderer for Rich Text
 */
export const RichText = withContext(BaseRichText) as RichTextComponent
export type { RichTextComponent, RichTextProps, RichTextNode, StringNode, TypedNode, NodeInput } from "./rich-text/index.js"
export { DefaultComponents as RichTextComponentDictionary, createHtmlComponent } from './rich-text/components.js'
export { isNodeInput, isNonEmptyString, isRichTextNode, isStringNode, isText, isTypedNode  } from "./rich-text/utils.js"

/**
 * Client side Optimizely CMS Editable 
 */
export const CmsEditable = withContext(BaseEditable) as CmsEditableComponent

/**
 * Client side Optimizely CMS Content, leveraging the CMS Context to load the
 * content type and content data when needed
 */
export const CmsContent = withContext(BaseCmsContent) as CmsContentComponent
export type { CmsContentComponent, CmsContentProps } from "./cms-content/client.js"

/**
 * Client side Optimizely CMS Content Area, leveraging the CMS Context to infer
 * the connection to Optimizely Graph and component dictionary.
 */
export const CmsContentArea = withCmsContent(withContext(BaseContentArea), CmsContent) as CmsContentAreaComponent
export type { CmsContentAreaClassMapper, CmsContentAreaComponent, CmsContentAreaProps, ContentAreaItemDefinition } from "./cms-content-area/index.js"

/**
 * Client side Optimizely Composition (e.g. Visual Builder), leveraging the CMS
 * Context to infer the connection to Optimizely Graph and component 
 * dictionary.
 */
export const OptimizelyComposition = withCmsContent(withContext(BaseOptimizelyComposition), CmsContent) as OptimizelyCompositionComponent
