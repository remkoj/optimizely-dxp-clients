import type { ReactNode, SuspenseProps } from "react"
import type { PropsWithContext } from "../../context/types.js"
import type { PropsWithCmsContent } from "../cms-content/types.js"
import type { ContentType } from "../../types.js"
import type { ElementChildrenProps, ElementProps, ElementType, PropTypeIfPropExists, MayBeArray, TypeIfPropExists } from '../type-utils.js'

export type ContentAreaItemDefinition = {
    __typename?:  string | null
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
    __typename?:  string | null
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

export type CmsContentAreaProps<T extends ElementType, CT extends ElementType> = {
    /**
     * The content area items to be rendered
     */
    items: (ContentAreaItemDefinition | null | undefined)[] | undefined | null
    /**
     * The mapper used to apply CSS Classes to items, based upon
     * the display mode (PaaS Only), Content type and position in
     * content area.
     */
    classMapper?: TypeIfPropExists<T, "className", CmsContentAreaClassMapper>
    /**
     * The CSS Class to apply to the content area container
     */
    className?: MayBeArray<PropTypeIfPropExists<T, "className">>
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
     * The HTML element, or React Component to use to render the Content Area Container
     */
    as?: T
    itemWrapper?: ({
        /**
         * Override the element type used to wrap the CMS Content Item
         */
        as?: CT

        /**
         * The CSS Class to apply to the content area item wrapper
         */
        className?: MayBeArray<PropTypeIfPropExists<CT, "className">>

    } & ("children" extends ElementChildrenProps<CT> ? {
        /**
         * The property of the component set for the "as" property of the Content Area Item
         * which should receive the items within the Content Area.
         * 
         * Defaults to "children", if not provided
         */
        itemsProperty?: ElementChildrenProps<CT>
    } : {
        /**
         * The property of the component set for the "as" property of the Content Area Item 
         * which should receive the items within the Content Area.
         */
        itemsProperty: ElementChildrenProps<CT>
    }) & Omit<Omit<ElementProps<CT>, "className" | "data-epi-block-id" | "data-displayoption" | "data-tag">, ElementChildrenProps<CT>>)
} & Omit<Omit<ElementProps<T>, "className" | "data-epi-edit">, ElementChildrenProps<T>> & ("children" extends ElementChildrenProps<T> ? {
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
})

export type CmsContentAreaClassMapper = (displayOption: string, contentType: ContentType | null, index: number) => string

export type BaseCmsContentAreaProps<T extends ElementType, CT extends ElementType> = PropsWithCmsContent<PropsWithContext<CmsContentAreaProps<T,CT>>>

export type CmsContentAreaBaseComponent = <T extends ElementType, CT extends ElementType>(props: BaseCmsContentAreaProps<T,CT>) => ReactNode
export type CmsContentAreaComponent = <T extends ElementType, CT extends ElementType>(props: CmsContentAreaProps<T,CT>) => ReactNode