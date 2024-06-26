import type { PropsWithChildren, ComponentType as ReactComponentType } from "react";
import type { DocumentNode } from "graphql";
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { IOptiGraphClient } from "@remkoj/optimizely-graph-client";
export type ContentType = string[];
export type ContentLink = {
    id: number;
    workId?: number | null;
    guidValue?: string | null;
} | {
    id?: number | null;
    workId?: number | null;
    guidValue: string;
};
export type InlineContentLink = {
    id: 0;
    workId?: 0 | null;
    guidValue?: null | "";
} | {
    id?: 0 | null;
    workId?: 0 | null;
    guidValue: "";
};
export type ContentLinkWithLocale = ContentLink & {
    locale?: string;
};
export type CmsComponentProps<T> = PropsWithChildren<{
    /**
     * The identifier of the content item
     */
    contentLink: ContentLinkWithLocale;
    /**
     * The data already pre-fetched for the this component
     */
    data: T;
    /**
     * Use the Server/Client context instead if you need this information
     *
     * @deprecated
     */
    inEditMode?: boolean;
    /**
     * Use the Server/Client context instead if you need this information
     *
     * @deprecated
     */
    client?: IOptiGraphClient;
}>;
export type ContentQueryProps = ContentLinkWithLocale;
/**
 * Extract the data type from a GraphQL Query
 */
export type ResponseDataType<T extends DocumentNode> = T extends TypedDocumentNode<infer DataType> ? DataType : {
    [key: string]: any;
};
export type GetDataQuery<T> = () => TypedDocumentNode<T, ContentQueryProps> | DocumentNode;
export type GetDataFragment<T> = () => [string, TypedDocumentNode<T, never> | DocumentNode];
export type WithGqlFragment<BaseComponent, DataType> = BaseComponent & {
    getDataFragment: GetDataFragment<DataType>;
    validateFragment?: (data: any) => data is DataType;
};
export type WithGqlQuery<B, T> = B & {
    getDataQuery: GetDataQuery<T>;
};
export type BaseCmsComponent<T = {}> = T extends never | TypedDocumentNode | DocumentNode ? DynamicCmsComponent<T> : ReactComponentType<CmsComponentProps<T>>;
export type DynamicCmsComponent<T extends TypedDocumentNode | DocumentNode = DocumentNode> = ReactComponentType<CmsComponentProps<ResponseDataType<T>>>;
export type GraphQLFragmentBase = {
    ' $fragmentName'?: string;
};
export type GraphQLQueryBase = {
    __typename?: 'Query';
};
export type CmsComponentWithFragment<T = DocumentNode> = BaseCmsComponent<T> & WithGqlFragment<{}, T>;
export type CmsComponentWithQuery<T = DocumentNode> = BaseCmsComponent<T> & WithGqlQuery<{}, T>;
export type CmsComponentWithOptionalQuery<T = DocumentNode> = BaseCmsComponent<T> & Partial<WithGqlQuery<{}, T>>;
/**
 * A generic Optimizely CMS Component that will change the static surface based upon the
 * provided data type for the component. It will detect automatically whether the component
 * requires a query or fragment to load the data and allows typechecking of the required
 * getDataFragement / getDataQuery methods are valid.
 *
 * When a type is provided that cannot be resolved to either the output of a Query or a Fragment,
 * it will assume an optional getDataQuery method.
 */
export type CmsComponent<T = DocumentNode> = T extends TypedDocumentNode<infer R, any> ? CmsComponentWithQuery<R> : T extends DocumentNode ? CmsComponentWithQuery<{
    [key: string]: any;
}> : T extends GraphQLFragmentBase ? CmsComponentWithFragment<T> : T extends GraphQLQueryBase ? CmsComponentWithQuery<T> : CmsComponentWithOptionalQuery<T>;
import type { createElement } from 'react';
export type ComponentType = Parameters<typeof createElement>[0];
export type ComponentTypeHandle = string | string[];
export type ComponentTypeDictionary = {
    type: ComponentTypeHandle;
    component: ComponentType;
}[];
export interface ComponentFactory {
    has(type: ComponentTypeHandle): boolean;
    register(type: ComponentTypeHandle, componentType: ComponentType): void;
    registerAll(components: ComponentTypeDictionary): void;
    resolve(type: ComponentTypeHandle): ComponentType | undefined;
}
