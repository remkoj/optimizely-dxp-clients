import { type PropsWithChildren, type ComponentType, type ComponentProps, type ReactNode } from 'react'
import type { CmsComponent } from '../../types.js'
import type { PropsWithContext } from "../../context/types.js"
import type { ContentLinkWithLocale, InlineContentLinkWithLocale } from "@remkoj/optimizely-graph-client"

export type CmsContentProps<LocalesType = string> = PropsWithChildren<{
    /**
     * The content type to render
     */
    contentType?: string[]

    /**
     * The content link to render
     */
    contentLink: ContentLinkWithLocale<LocalesType> | InlineContentLinkWithLocale<LocalesType>

    /**
     * The initial, pre-loaded data. If set this will be used instead of having the
     * component fetching its' own data. So be sure that this leverages the fragment
     * specified by the component.
     * 
     * It will filter out the fiels from the IContentData fragment, to determine if
     * data has been provided.
     */
    fragmentData?: {
        [fieldname: string]: any
    }

    /**
     * The native key to use when the element is part of an array
     */
    key?: string

    /**
     * The prefix to apply to the content type, to allow loading of different templates based
     * upon location of usage. If set and the content type already starts with this prefix,
     * it will not be applied.
     */
    contentTypePrefix?: string

    /**
     * The content type variant to load. This allows the loading of a variant (e.g. postfix) of
     * the content type
     */
    variant?: string

    /**
     * Any layout properties inferred from the context
     */
    layoutProps?: Record<string, any>

    /**
     * When set to true, this will prevent the CmsContent component to try loading content from
     * the store
     */
    noDataLoad?: boolean
}>

export type PropsWithCmsContent<T = any> = T & {
    cmsContent: CmsContentComponent
}

export type BaseCmsContentProps<LocalesType = string> = PropsWithContext<CmsContentProps<LocalesType>>

export type CmsContentComponent = <LocalesType = string>(props: CmsContentProps<LocalesType>) => ReactNode

export type CmsContentBaseComponent = <LocalesType = string>(props: BaseCmsContentProps<LocalesType>) => ReactNode

export type CmsComponentProps = ComponentProps<CmsComponent> & {
    [key: string]: any
}

export type EnhancedCmsComponent = ComponentType<CmsComponentProps>