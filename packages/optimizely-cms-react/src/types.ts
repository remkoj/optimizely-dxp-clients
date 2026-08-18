import type { PropsWithChildren, ComponentType as ReactComponentType } from "react"
import type { DocumentNode } from "graphql"
import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { ContentLinkWithLocale, ContentLink, InlineContentLinkWithLocale } from "@remkoj/optimizely-graph-client"
import type { GenericContext } from "./context/types.js"
import type { CmsEditableProps } from "./components/cms-editable/index.js"
import type { VariationInput } from "@remkoj/optimizely-graph-client/router"

export type { VariationInput } from "@remkoj/optimizely-graph-client/router"

// Export reused content types
/**
 * The (hierarchical) content type of a content item, ordered from most to
 * least specific.
 */
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

/**
 * The minimal set of `CmsEditableProps` needed to render a `CmsEditable`
 * from within a `CmsComponent`
 */
export type ComponentCmsEditableProps = Pick<CmsEditableProps<'div'>, 'cmsId' | 'ctx' | 'currentContent'>

/**
 * The properties every `CmsComponent` receives when rendered
 */
export type CmsComponentProps<T, L extends Record<string, unknown> = Record<string, unknown>> = PropsWithChildren<{
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

/**
 * The normalized set of request variables used to query for content across
 * multiple components.
 */
export type ContentQueryProps<LocaleType = string> = Omit<ContentLink, 'isInline' | 'variation'> & {
  locale?: Array<LocaleType> | LocaleType | null
  path?: string | null
  domain?: string | null
  variation?: VariationInput | null
}

/**
 * Extract the data type from a GraphQL Query
 */
export type ResponseDataType<T extends DocumentNode> = T extends TypedDocumentNode<infer DataType> ? DataType : Record<string,unknown>;

/**
 * The shape of the response of the two-query content loading pattern used by
 * `getDataQuery`, from which the actual content item is extracted.
 */
export type GetDataQueryResponseTemplate = {
  __typename?: 'Query' | null,
  data?: {
    __typename?: string | null;
    item?: {
      __typename?: string | null;
      _metadata?: {
        key?: string | null
        locale?: unknown | null
      } | null,
      [key: string]: unknown
    } | null
  } | null
}

/**
 * Extract the actual content item data from a `GetDataQueryResponseTemplate`
 * shaped response, or pass through `T` unchanged if it doesn't match.
 */
export type ProcessQueryResponse<T> = T extends GetDataQueryResponseTemplate ? NonNullable<NonNullable<Required<T>['data']>['item']> : T

/**
 * A method exposed by a `CmsComponent` to provide the GraphQL query used to
 * load its data.
 */
export type GetDataQuery<T> = () => TypedDocumentNode<T, Omit<ContentQueryProps, 'path' | 'domain'>> | DocumentNode

/**
 * A method exposed by a `CmsComponent` to provide the name and GraphQL
 * fragment used to load its data.
 */
export type GetDataFragment<T> = () => [string, TypedDocumentNode<T, never> | DocumentNode | string]

/**
 * Extends a base component type with the `getDataFragment` (and optional
 * `validateFragment`) static methods
 */
export type WithGqlFragment<BaseComponent, DataType> = BaseComponent & {
  getDataFragment: GetDataFragment<DataType>
  validateFragment?: (data: unknown) => data is DataType
}

/**
 * Extends a base component type with the `getDataQuery` static method
 */
export type WithGqlQuery<B, T> = B & {
  getDataQuery: GetDataQuery<T>
}

/**
 * The base React component shape for a `CmsComponent`, resolving to a
 * `DynamicCmsComponent` when `T` is a query/fragment document, or a plain
 * React component otherwise.
 */
export type BaseCmsComponent<T = object, L extends Record<string, unknown> = Record<string, unknown>> = T extends never | TypedDocumentNode | DocumentNode ?
  DynamicCmsComponent<ProcessQueryResponse<T>> :
  ReactComponentType<CmsComponentProps<ProcessQueryResponse<T>, L>>

/**
 * A React component that receives its data as typed by the response of the
 * given GraphQL query or fragment document
 */
export type DynamicCmsComponent<T extends TypedDocumentNode | DocumentNode = DocumentNode, L extends Record<string, unknown> = Record<string, unknown>> = ReactComponentType<CmsComponentProps<ResponseDataType<T>, L>>

/**
 * Structural type used to detect whether a generic type parameter represents
 * a GraphQL fragment
 */
export type GraphQLFragmentBase = { ' $fragmentName'?: string }

/**
 * Structural type used to detect whether a generic type parameter represents
 * a GraphQL query
 */
export type GraphQLQueryBase = { __typename?: 'Query' }

/**
 * A `CmsComponent` that loads its data through a GraphQL fragment
 */
export type CmsComponentWithFragment<T = DocumentNode, L extends Record<string, unknown> = Record<string, unknown>> = BaseCmsComponent<T, L> & WithGqlFragment<object, T>

/**
 * A `CmsComponent` that loads its data through a GraphQL query
 */
export type CmsComponentWithQuery<T = DocumentNode, L extends Record<string, unknown> = Record<string, unknown>> = BaseCmsComponent<T, L> & WithGqlQuery<object, T>

/**
 * A `CmsComponent` that may optionally load its data through a GraphQL query
 */
export type CmsComponentWithOptionalQuery<T = DocumentNode, L extends Record<string, unknown> = Record<string, unknown>> = BaseCmsComponent<T, L> & Partial<WithGqlQuery<object, T>>

/**
 * A generic Optimizely CMS Component that will change the static surface based upon the 
 * provided data type for the component. It will detect automatically whether the component
 * requires a query or fragment to load the data and allows typechecking of the required
 * getDataFragement / getDataQuery methods are valid.
 * 
 * When a type is provided that cannot be resolved to either the output of a Query or a Fragment,
 * it will assume an optional getDataQuery method.
 */
export type CmsComponent<T = DocumentNode, L extends Record<string, unknown> = Record<string, unknown>> =
  T extends TypedDocumentNode<infer R, unknown> ? CmsComponentWithQuery<R, L> :
    T extends DocumentNode ? CmsComponentWithQuery<{ [key: string]: unknown }, L> :
      T extends GraphQLFragmentBase ? CmsComponentWithFragment<T, L> :
        T extends GraphQLQueryBase ? CmsComponentWithQuery<T, L> :
          CmsComponentWithOptionalQuery<T, L>

/**
 * A generic Optimizely CMS Component used to render a layout node from an experience, which cannot
 * be loaded directly as independent Content Item from Optimizely Graph
 */
export type CmsLayoutComponent<L extends Record<string, unknown> = Record<string, unknown>, T = never> = ReactComponentType<CmsComponentProps<T, L>>