import type { PropsWithChildren, ComponentType as ReactComponentType } from "react"
import type { DocumentNode } from "graphql"
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { ContentLinkWithLocale, ContentLink, InlineContentLinkWithLocale } from "@remkoj/optimizely-graph-client"
import type { GenericContext } from "./context/types.js"
import type { CmsEditableProps } from "./components/cms-editable/index.js"

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

export type ComponentCmsEditableProps = Pick<CmsEditableProps<'div'>, 'cmsId' | 'ctx' | 'currentContent'>

export type CmsComponentProps<T, L extends Record<string, any> = Record<string, any>> = PropsWithChildren<{
  /**
   * The identifier of the content item.
   */
  contentLink: ContentLinkWithLocale | InlineContentLinkWithLocale

  /**
   * The data already pre-fetched for the this component
   */
  data: T,

  /**
   * Use the Server/Client context instead if you need this information
   * 
   * @deprecated
   */
  inEditMode?: boolean

  /**
   * Contextual layout data from an Experience. This will be `undefined` if 
   * there's no layout data attached.
   */
  layoutProps?: L

  /**
   * The minimal properties needed to render a CmsEditable inside the
   * component.
   */
  editProps?: ComponentCmsEditableProps

  /**
   * The context in which this component will be rendered
   */
  ctx?: GenericContext
}>

export type ContentQueryProps<LocaleType = string> = Omit<ContentLink, 'isInline'> & {
  locale?: Array<LocaleType> | LocaleType | null
  path?: string | null
  domain?: string | null
  changeset?: string | null
  variant?: string | null
}

/**
 * Extract the data type from a GraphQL Query
 */
export type ResponseDataType<T extends DocumentNode> = T extends TypedDocumentNode<infer DataType> ? DataType : { [key: string]: any };

export type GetDataQueryResponseTemplate = {
  __typename?: 'Query' | null,
  data?: {
    __typename?: string | null;
    item?: {
      __typename?: string | null;
      _metadata?: {
        key?: string | null
      } | null,
      [key: string]: any
    } | null
  } | null
}
export type ProcessQueryResponse<T> = T extends GetDataQueryResponseTemplate ? NonNullable<NonNullable<Required<T>['data']>['item']> : T
export type GetDataQuery<T> = () => TypedDocumentNode<T, Omit<ContentQueryProps, 'path' | 'domain'>> | DocumentNode
export type GetDataFragment<T> = () => [string, TypedDocumentNode<T, never> | DocumentNode | string]

export type WithGqlFragment<BaseComponent, DataType> = BaseComponent & {
  getDataFragment: GetDataFragment<DataType>
  validateFragment?: (data: any) => data is DataType
}
export type WithGqlQuery<B, T> = B & {
  getDataQuery: GetDataQuery<T>
}
export type BaseCmsComponent<T = {}, L extends Record<string, any> = Record<string, any>> = T extends never | TypedDocumentNode | DocumentNode ?
  DynamicCmsComponent<ProcessQueryResponse<T>> :
  ReactComponentType<CmsComponentProps<ProcessQueryResponse<T>, L>>

export type DynamicCmsComponent<T extends TypedDocumentNode | DocumentNode = DocumentNode, L extends Record<string, any> = Record<string, any>> = ReactComponentType<CmsComponentProps<ResponseDataType<T>, L>>
export type GraphQLFragmentBase = { ' $fragmentName'?: string }
export type GraphQLQueryBase = { __typename?: 'Query' }
export type CmsComponentWithFragment<T = DocumentNode, L extends Record<string, any> = Record<string, any>> = BaseCmsComponent<T, L> & WithGqlFragment<{}, T>
export type CmsComponentWithQuery<T = DocumentNode, L extends Record<string, any> = Record<string, any>> = BaseCmsComponent<T, L> & WithGqlQuery<{}, T>
export type CmsComponentWithOptionalQuery<T = DocumentNode, L extends Record<string, any> = Record<string, any>> = BaseCmsComponent<T, L> & Partial<WithGqlQuery<{}, T>>

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

/**
 * A generic Optimizely CMS Component used to render a layout node from an experience, which cannot
 * be loaded directly as independent Content Item from Optimizely Graph
 */
export type CmsLayoutComponent<L extends Record<string, any> = Record<string, any>, T = never> = ReactComponentType<CmsComponentProps<T, L>>