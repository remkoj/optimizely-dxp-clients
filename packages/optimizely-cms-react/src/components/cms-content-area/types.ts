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
   * The content area items to be rendered
   */
  items: (ContentAreaItemDefinition | null | undefined)[] | undefined | null

  /**
   * Whether or not a suspense must be applied around each item of the 
   * ContentArea to allow dynamic content within the ContentArea items.
   */
  useSuspense?: boolean

  /**
   * The fallback component to use as suspense boundary
   */
  fallback?: SuspenseProps['fallback']

  /**
   * The fieldname of this content area, provide this to allow in-context 
   * editing
   */
  fieldName?: string

  /**
   * If set to true, there will be no wrapping element around the 
   * items in the Content Area. Setting this to `true` ignores
   */
  noWrapper?: boolean

  /**
   * Allows requesting of specific template variant, to accomodate different
   * renditions, without changing the main path of the component.
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


export type CmsContentAreaProps<T extends ElementType, CT extends ElementType> =
  CmsContentAreaCoreProps &
  CmsContentAreaWrapperProps<T, CT>

export type CmsContentAreaClassMapper = (displayOption: string, contentType: ContentType | null, index: number) => string

export type BaseCmsContentAreaProps<T extends ElementType, CT extends ElementType> = PropsWithCmsContent<PropsWithContext<CmsContentAreaProps<T, CT>>>

export type CmsContentAreaBaseComponent = <T extends ElementType, CT extends ElementType>(props: BaseCmsContentAreaProps<T, CT>) => ReactNode
export type CmsContentAreaComponent = <T extends ElementType, CT extends ElementType>(props: CmsContentAreaProps<T, CT>) => ReactNode