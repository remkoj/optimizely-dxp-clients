import type { PropsWithChildren, ComponentType as ReactComponentType } from "react"
import type { DocumentNode } from "graphql"
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { ContentLinkWithLocale, ContentLink, InlineContentLinkWithLocale } from "@remkoj/optimizely-graph-client"

// Export reused content types
export type ContentType = string[]
export type { 
    /**
     * @deprecated  Use the export from `@remkoj/optimizely-graph-client` directly
     */
    ContentLink, 
    /**
     * @deprecated  Use the export from `@remkoj/optimizely-graph-client` directly
     */
    ContentLinkWithLocale 
} from "@remkoj/optimizely-graph-client"

export type CmsComponentProps<T, L extends Record<string, any> = Record<string, any>> = PropsWithChildren<{
    /**
     * The identifier of the content item
     */
    contentLink: ContentLinkWithLocale | InlineContentLinkWithLocale

    /**
     * The data already pre-fetched for the this component
     */
    data: T,

    /**
     * Use the Server/Client context instead if you need this information
     */
    inEditMode?: boolean

    /**
     * Contextual layout data, if any
     */
    layoutProps?: L
}>

export type ContentQueryProps<LocaleType = string> = ContentLink & {
    locale?: Array<LocaleType> | LocaleType | null
    path?: string | null
    domain?: string | null
}

/**
 * Extract the data type from a GraphQL Query
 */
export type ResponseDataType<T extends DocumentNode> = T extends TypedDocumentNode<infer DataType> ? DataType : { [key: string ]: any };

export type GetDataQuery<T> = () => TypedDocumentNode<T, ContentQueryProps> | DocumentNode
export type GetDataFragment<T> = () => [ string, TypedDocumentNode<T, never> | DocumentNode ]

export type WithGqlFragment<BaseComponent, DataType> = BaseComponent & {
    getDataFragment: GetDataFragment<DataType>
    validateFragment?: (data: any) => data is DataType
}
export type WithGqlQuery<B,T> = B & {
    getDataQuery: GetDataQuery<T>
}
export type BaseCmsComponent<T = {}, L extends Record<string, any> = Record<string, any>> = T extends never | TypedDocumentNode | DocumentNode ?
    DynamicCmsComponent<T> :
    ReactComponentType<CmsComponentProps<T, L>>

export type DynamicCmsComponent<T extends TypedDocumentNode | DocumentNode = DocumentNode, L extends Record<string, any> = Record<string, any>> = ReactComponentType<CmsComponentProps<ResponseDataType<T>, L>>
export type GraphQLFragmentBase = { ' $fragmentName'?: string }
export type GraphQLQueryBase = { __typename?: 'Query' }
export type CmsComponentWithFragment<T = DocumentNode, L extends Record<string, any> = Record<string, any>> = BaseCmsComponent<T, L> & WithGqlFragment<{},T>
export type CmsComponentWithQuery<T = DocumentNode, L extends Record<string, any> = Record<string, any>> = BaseCmsComponent<T, L> & WithGqlQuery<{},T>
export type CmsComponentWithOptionalQuery<T = DocumentNode, L extends Record<string, any> = Record<string, any>> = BaseCmsComponent<T, L> & Partial<WithGqlQuery<{},T>>

/**
 * A generic Optimizely CMS Component that will change the static surface based upon the 
 * provided data type for the component. It will detect automatically whether the component
 * requires a query or fragment to load the data and allows typechecking of the required
 * getDataFragement / getDataQuery methods are valid.
 * 
 * When a type is provided that cannot be resolved to either the output of a Query or a Fragment,
 * it will assume an optional getDataQuery method.
 */
export type CmsComponent<T = DocumentNode, L extends Record<string, any> = Record<string, any>> = 
        T extends TypedDocumentNode<infer R, any> ? CmsComponentWithQuery<R, L> : 
        T extends DocumentNode ? CmsComponentWithQuery<{ [key: string]: any }, L> :
        T extends GraphQLFragmentBase ? CmsComponentWithFragment<T, L> : 
        T extends GraphQLQueryBase ? CmsComponentWithQuery<T, L> :
        CmsComponentWithOptionalQuery<T, L>
export type CmsLayoutComponent<L extends Record<string, any> = Record<string, any>, T = never> = ReactComponentType<CmsComponentProps<T, L>>