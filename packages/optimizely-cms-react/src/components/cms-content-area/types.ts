import type { ReactNode, SuspenseProps } from "react"
import type { PropsWithContext, PropsWithOptionalContext } from "../../context/types.js"
import type { PropsWithCmsContent } from "../cms-content/types.js"
import type { ContentType } from "../../types.js"
import type { ElementChildrenProps, ElementProps, ElementType, PropTypeIfPropExists, MayBeArray, TypeIfPropExists, ReservedKeys } from '../type-utils.js'

export type ContentAreaItemDefinition = {
  __typename?: string | null
  _type?: string | null
  _metadata?: {
    key?: string | null
    locale?: string | null
    types?: Array<string | null> | null
    displayName?: string | null
    version?: string | null
    url?: {
      base?: string | null
      hierarchical?: string | null
      default?: string | null
    } | null
  } | null
} & Record<string, any>

export type ValidContentAreaItemDefinition = {
  __typename?: string | null
  _type?: string | null
  _metadata: {
    key?: string | null
    locale?: string | null
    types?: Array<string | null> | null
    displayName?: string | null
    version?: string | null
    url?: {
      base?: string | null
      hierarchical?: string | null
      default?: string | null
    } | null
  }
} & Record<string, any>

export type ItemsProperty<T extends ElementType> = "children" extends ElementChildrenProps<T> ? {
  /**
   * The property of the component set for the "as" property of the Content Area which
   * should receive the items within the Content Area.
   * 
   * Defaults to "children", if not provided
   */
  itemsProperty?: ElementChildrenProps<T>
} : {
  /**
   * The property of the component set for the "as" property of the Content Area which
   * should receive the items within the Content Area.
   */
  itemsProperty: ElementChildrenProps<T>
}

export type PassthroughProps<T extends ElementType, ParentKeys extends string | number | symbol> = Omit<ElementProps<T>, ParentKeys | ReservedKeys | ElementChildrenProps<T>> /*& { [K in ReservedKeys]?: never }*/

export type CmsContentAreaCoreProps = PropsWithOptionalContext<{
  /**
  * Content area items to render.
  *
  * Each item should contain `_metadata` with at least a key and content type data.
   */
  items: (ContentAreaItemDefinition | null | undefined)[] | undefined | null

  /**
    * Whether a suspense boundary is applied around each rendered content area item.
   */
  useSuspense?: boolean

  /**
    * Fallback UI rendered while suspense-wrapped items are loading.
   */
  fallback?: SuspenseProps['fallback']

  /**
    * Name of the CMS field represented by this content area.
    *
    * Set this to enable in-context edit markers for the content area container.
   */
  fieldName?: string

  /**
    * If `true`, no container wrapper is rendered around the full list of items.
   */
  noWrapper?: boolean

  /**
   * Optional template variant forwarded to each `CmsContent` item render.
   */
  variant?: string
}>
export type CmsContentAreaWrapperProps<T extends ElementType, CT extends ElementType> = {
  /**
   * The HTML element, or React Component to use to render the Content Area Container
   */
  as?: T

  /**
   * The mapper used to apply CSS Classes to items, based upon
   * the display mode (PaaS Only), Content type and position in
   * content area.
   */
  classMapper?: TypeIfPropExists<T, "className", CmsContentAreaClassMapper>

  /**
   * The CSS Class to apply to the content area item wrapper
   */
  className?: MayBeArray<PropTypeIfPropExists<T, "className">>

  /**
   * Configure the wrapper for each item within the ContentArea
   */
  itemWrapper?: CmsContentAreaItemWrapperProps<CT>
} & ItemsProperty<T> & PassthroughProps<T, "as" | "classMapper" | "className" | "itemWrapper" | keyof CmsContentAreaCoreProps>

export type CmsContentAreaItemWrapperProps<CT extends ElementType> = ({
  /**
   * Override the element type used to wrap the CMS Content Item
   */
  as?: CT

  /**
   * If set to true, there will be no wrapping element around the 
   * CmsContent used to render the item. Setting this to `true`
   * ignores all other `itemWrapper` properties.
   */
  noWrapper?: boolean

  /**
   * The CSS Class to apply to the content area item wrapper
   */
  className?: MayBeArray<PropTypeIfPropExists<CT, "className">>
} & ItemsProperty<CT> & PassthroughProps<CT, "as" | "noWrapper" | "className">)


/**
 * Properties for `CmsContentArea`.
 *
 * Combines core rendering options and wrapper customization options.
 *
 * Property overview:
 * - `items` (required): content area items to render.
 * - `fieldName`: enables edit marker output for the content area.
 * - `variant`: template variant for all rendered items.
 * - `useSuspense` + `fallback`: per-item suspense rendering.
 * - `noWrapper`: disables outer content area container.
 * - `as`: outer container element/component.
 * - `itemsProperty`: target prop on `as` component to inject item list.
 * - `className`: classes for outer container.
 * - `classMapper`: computes per-item wrapper classes from display option/type/index.
 * - `itemWrapper`: configures per-item wrapper element, classes and prop target.
 * - `ctx`: optional CMS context override.
 *
 * @example
 * ```tsx
 * <CmsContentArea
 *   items={content.MainContentArea}
 *   fieldName="MainContentArea"
 *   as="section"
 *   className="main-content"
 * />
 * ```
 *
 * @example
 * ```tsx
 * <CmsContentArea
 *   items={content.SidebarContentArea}
 *   itemWrapper={{ as: 'aside', className: 'sidebar-item' }}
 *   classMapper={(displayOption, contentType, index) =>
 *     `item-${index} display-${displayOption} type-${contentType?.join('-') ?? 'unknown'}`
 *   }
 *   useSuspense
 *   fallback={<div>Loading…</div>}
 * />
 * ```
 */
export type CmsContentAreaProps<T extends ElementType, CT extends ElementType> =
  CmsContentAreaCoreProps &
  CmsContentAreaWrapperProps<T, CT>

export type CmsContentAreaClassMapper = (displayOption: string, contentType: ContentType | null, index: number) => string

export type BaseCmsContentAreaProps<T extends ElementType, CT extends ElementType> = PropsWithCmsContent<PropsWithContext<CmsContentAreaProps<T, CT>>>

export type CmsContentAreaBaseComponent = <T extends ElementType, CT extends ElementType>(props: BaseCmsContentAreaProps<T, CT>) => ReactNode
export type CmsContentAreaComponent = <T extends ElementType, CT extends ElementType>(props: CmsContentAreaProps<T, CT>) => ReactNode
