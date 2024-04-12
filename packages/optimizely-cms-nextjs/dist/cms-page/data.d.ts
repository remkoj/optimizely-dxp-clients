import { GraphQLClient } from "graphql-request";
export type GetContentByPathVariables<LocaleType = string> = {
    path: string;
    locale?: Array<LocaleType | null> | LocaleType | null;
    siteId?: string | null;
};
type MayBe<T> = T extends Array<infer R> ? Array<R | null> | null : T | null;
export type GetContentByPathResponse<LocaleType = string> = {
    content?: MayBe<{
        items?: MayBe<Array<{
            _metadata?: MayBe<{
                key?: MayBe<string>;
                locale?: MayBe<LocaleType>;
                types?: MayBe<Array<string>>;
                displayName?: MayBe<string>;
                version?: MayBe<string>;
            }>;
            _type?: MayBe<string>;
        }>>;
    }>;
};
export type GetMetaDataByPathResponse = {
    getGenericMetaData?: {
        items?: Array<{
            name?: string;
            alternatives?: Array<{
                locale?: string | null;
                href?: string | null;
            } | null> | null;
            canonical?: string | null;
        } | null>;
    };
};
export type GetContentByPathMethod<LocaleType = string> = (client: GraphQLClient, variables: GetContentByPathVariables<LocaleType>) => Promise<GetContentByPathResponse<LocaleType>>;
export type GetMetaDataByPathMethod<LocaleType = string> = (client: GraphQLClient, variables: GetContentByPathVariables<LocaleType>) => Promise<GetMetaDataByPathResponse>;
export declare const getMetaDataByPath: GetMetaDataByPathMethod;
export declare const getContentByPath: GetContentByPathMethod;
export default getContentByPath;
