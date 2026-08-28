'use server'
import 'server-only'
import type { ComponentType, FunctionComponent } from 'react'
import type {
  PropsWithCrossBoundaryContext,
  PropsWithContext,
  WithContextFunction
} from '../context/types.js'
import { isTransferrableContext, isGenericContext } from '../context/shared.js'
import { ServerContext } from '../context/rsc.js'
import { withCmsContent } from './cms-content/utils.js'
import { isNullOrUndefined } from '../utilities.js'

import {
  CmsContentArea as BaseContentArea,
  type CmsContentAreaComponent,
} from './cms-content-area/index.js' // Both RSC & Client capable
import {
  CmsEditable as BaseEditable,
  type CmsEditableComponent,
} from './cms-editable/index.js' // Both RSC & Client capable
import {
  CmsContent as BaseCmsContent,
  type CmsContentComponent,
  type CmsContentBaseComponent,
} from './cms-content/rsc.js' // Different components for RSC & Client
import {
  OptimizelyComposition as BaseOptimizelyComposition,
  type OptimizelyCompositionComponent,
} from './visual-builder/index.js' // Both RSC & Client capable
import {
  RichText as BaseRichText,
  type RichTextComponent,
} from './rich-text/index.js'


const withContext: WithContextFunction = <
  P = object
>(component: ComponentType<PropsWithContext<P>>) => {
  const BaseComponent = component;
  const ServerContextInjector: FunctionComponent<PropsWithCrossBoundaryContext<P>> = ({ ctx, ...props }) => {
    if (isGenericContext(ctx))
      return <BaseComponent { ...(props as P) } ctx={ctx} />
    else if (isTransferrableContext(ctx)) {
      const context = ServerContext.fromTransferrableContext(ctx)
      return <BaseComponent { ...(props as P) } ctx={context} />
    } else if (isNullOrUndefined(ctx)) {
      const context = new ServerContext()
      return <BaseComponent { ...(props as P) } ctx={context} />
    } else {
      console.error(
        `🔴 [RSC][withContext] Context for context aware component ${BaseComponent.displayName ?? BaseComponent.name ?? '[ANONYMOUS]'} is invalid!`
      )
      throw new Error(
        `RSC withContext: Context for context aware component ${BaseComponent.displayName ?? BaseComponent.name ?? '[ANONYMOUS]'} is invalid!`
      )
    }
  }
  ServerContextInjector.displayName = 'Server Context Injector'
  return ServerContextInjector;
}

/**
 * Optimizely CMS editable marker wrapper for React Server Components.
 *
 * `CmsEditable` renders an element (default `div`) and conditionally injects
 * Optimizely edit-mode attributes (`data-epi-*`) based on the current CMS
 * context. In non-edit mode it behaves like a transparent wrapper.
 *
 * Key behavior:
 * - Uses `ctx` from props when provided, otherwise resolves server context.
 * - Injects edit attributes only when rendering in edit mode.
 * - Supports custom wrapper elements/components via `as`.
 * - Can forward `ctx` to custom components via `forwardCtx`.
 *
 * @example
 * ```tsx
 * import { CmsEditable } from '@remkoj/optimizely-cms-react/rsc'
 *
 * export function PageTitle({ title, id }: { title: string, id: string }) {
 *   return (
 *     <CmsEditable as="h1" cmsId={id} cmsFieldName="Title">
 *       {title}
 *     </CmsEditable>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * import { CmsEditable } from '@remkoj/optimizely-cms-react/rsc'
 *
 * function Heading(props: { children: React.ReactNode, cmsCtx?: unknown }) {
 *   return <h2>{props.children}</h2>
 * }
 *
 * export function Teaser({ id, title }: { id: string, title: string }) {
 *   return (
 *     <CmsEditable
 *       as={Heading}
 *       cmsId={id}
 *       cmsFieldName="Heading"
 *       forwardCtx="cmsCtx"
 *     >
 *       {title}
 *     </CmsEditable>
 *   )
 * }
 * ```
 *
 * @remarks
 * For a full prop reference, see `CmsEditableProps`.
 */
export const CmsEditable = withContext(
  BaseEditable
) as CmsEditableComponent
export type { CmsEditableComponent, CmsEditableProps } from './cms-editable/index.js'

/**
 * Optimizely CMS content renderer for React Server Components.
 *
 * `CmsContent` resolves the component template for a content item and provides
 * that template with loaded data and edit metadata.
 *
 * Key behavior:
 * - Resolves content type from `contentType`, `fragmentData`, or Graph lookup.
 * - Resolves template using context component dictionary and optional
 *   `contentTypePrefix` / `variant`.
 * - Loads content data unless `noDataLoad` is set.
 * - Passes `editProps` to resolved CMS templates for in-context editing.
 *
 * Required props:
 * - `contentLink`
 *
 * Optional props:
 * - `contentType`, `contentTypePrefix`, `variant`, `fragmentData`, `layoutProps`,
 *   `noDataLoad`, `editorComponentId`, `ctx`
 *
 * @example
 * ```tsx
 * import { CmsContent } from '@remkoj/optimizely-cms-react/rsc'
 *
 * export default async function Slot({ contentLink }: { contentLink: { key: string, locale?: string } }) {
 *   return (
 *     <CmsContent
 *       contentLink={contentLink}
 *       contentTypePrefix="Page"
 *       variant="default"
 *     />
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * import { CmsContent } from '@remkoj/optimizely-cms-react/rsc'
 *
 * export function PreloadedBlock({ contentLink, fragmentData }: { contentLink: { key: string }, fragmentData: Record<string, any> }) {
 *   return (
 *     <CmsContent
 *       contentLink={contentLink}
 *       fragmentData={fragmentData}
 *       contentType={["Component", "TeaserBlock"]}
 *     />
 *   )
 * }
 * ```
 *
 * @remarks
 * For a full prop reference, see `CmsContentProps`.
 */
export const CmsContent = withContext(
  BaseCmsContent as unknown as CmsContentBaseComponent
) as CmsContentComponent
export type { CmsContentComponent, CmsContentProps } from './cms-content/rsc.js'

/**
 * Optimizely CMS Content Area renderer for React Server Components.
 *
 * `CmsContentArea` renders a list of content area items by delegating each item
 * to `CmsContent`, with optional container and item-wrapper customization.
 *
 * Key behavior:
 * - Renders each item as `CmsContent` with normalized content link and type.
 * - Adds edit markers for the content area in edit mode when `fieldName` is set.
 * - Supports optional wrappers (`as`, `itemWrapper`) or no wrappers.
 * - Supports per-item suspense boundaries (`useSuspense`, `fallback`).
 *
 * Required props:
 * - `items`
 *
 * Optional props:
 * - `fieldName`, `variant`, `as`, `itemsProperty`, `className`, `classMapper`,
 *   `itemWrapper`, `noWrapper`, `useSuspense`, `fallback`, `ctx`
 *
 * @example
 * ```tsx
 * import { CmsContentArea } from '@remkoj/optimizely-cms-react/rsc'
 *
 * export function MainArea({ items }: { items: any[] }) {
 *   return (
 *     <CmsContentArea
 *       items={items}
 *       fieldName="MainContentArea"
 *       as="section"
 *       className="main-content-area"
 *     />
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * import { CmsContentArea } from '@remkoj/optimizely-cms-react/rsc'
 *
 * export function GridArea({ items }: { items: any[] }) {
 *   return (
 *     <CmsContentArea
 *       items={items}
 *       itemWrapper={{ as: 'article', className: 'grid-item' }}
 *       classMapper={(displayOption) => `display-${displayOption}`}
 *       useSuspense
 *       fallback={<div>Loading component…</div>}
 *     />
 *   )
 * }
 * ```
 *
 * @remarks
 * For a full prop reference, see `CmsContentAreaProps`.
 */
export const CmsContentArea = withCmsContent(
  withContext(BaseContentArea),
  CmsContent
) as CmsContentAreaComponent
export type {
  CmsContentAreaClassMapper,
  CmsContentAreaComponent,
  CmsContentAreaProps,
  ContentAreaItemDefinition,
} from './cms-content-area/index.js'

/**
 * Client side Optimizely Composition (e.g. Visual Builder), leveraging the CMS
 * Context to infer the connection to Optimizely Graph and component
 * dictionary.
 */
export const OptimizelyComposition = withCmsContent(
  withContext(BaseOptimizelyComposition),
  CmsContent
) as OptimizelyCompositionComponent

/**
 * Client side renderer for Rich Text
 */
export const RichText = withContext(BaseRichText) as RichTextComponent
