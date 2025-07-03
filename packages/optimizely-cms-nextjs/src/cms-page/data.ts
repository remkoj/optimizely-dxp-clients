//import { gql } from "graphql-request"
import { type IOptiGraphClient } from "@remkoj/optimizely-graph-client"

export type GetContentByPathVariables<LocaleType = string> = {
  path: string | string[],
  locale?: Array<LocaleType> | LocaleType,
  siteId?: string,
  changeset?: string | null
}

type MayBe<T> = T extends Array<infer R> ? Array<R | null> | null : T | null

export type GetContentByPathResponse = {
  content?: MayBe<{
    items?: MayBe<Array<{
      __typename?: MayBe<string>
      _type?: MayBe<string>
    } & Record<string, any>> | {
      __typename?: MayBe<string>
      _type?: MayBe<string>
    } & Record<string, any>>,
    total?: MayBe<number>
  }>
}

export type GetMetaDataByPathResponse = {
  getGenericMetaData?: {
    items?: Array<{
      name?: string,
      alternatives?: Array<{
        locale?: string | null
        href?: string | null
      } | null> | null
      canonical?: string | null
    } | null>
  }
}

export type GetContentByPathMethod<LocaleType = string> = (client: IOptiGraphClient, variables: GetContentByPathVariables<LocaleType>) => Promise<GetContentByPathResponse>
export type GetMetaDataByPathMethod<LocaleType = string> = (client: IOptiGraphClient, variables: GetContentByPathVariables<LocaleType>) => Promise<GetMetaDataByPathResponse>