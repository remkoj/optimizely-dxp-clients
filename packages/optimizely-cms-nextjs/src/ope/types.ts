import { type ComponentType, type PropsWithChildren, type JSX } from 'react'
import { type ClientFactory } from '@remkoj/optimizely-graph-client'
import { type GraphQLClient } from 'graphql-request'
import { type ContentQueryProps } from '@remkoj/optimizely-cms-react/rsc'

export type ContentRequest = (Omit<ContentQueryProps<string>, 'path'> & { path: string | null, token: string, ctx: 'edit' | 'preview' })

type ServerPageProps = { params: Promise<Record<string, string | Array<string>>>, searchParams: Promise<Record<string, string>> }
export type EditPageComponent<T extends ServerPageProps = EditPageProps> = ({ params, searchParams }: T) => Promise<JSX.Element>

export type EditPageProps = {
  readonly params: Promise<{
    readonly path?: string[] | string
    readonly lang?: string
  }>,
  readonly searchParams: Promise<{
    readonly preview_token: string
    readonly key?: string
    readonly ver?: string
    readonly loc?: string
    readonly ctx?: 'edit' | 'preview'
    readonly path?: string
    readonly epieditmode?: string
  }>
}

export type AwaitedEditPageProps = {
  [K in keyof EditPageProps]: Awaited<EditPageProps[K]>
}

export type ValidatedEditPageProps = {
  readonly params: {
    readonly path?: string[] | string
    readonly lang?: string
  },
  searchParams: {
    readonly preview_token: string
  } & ({
    readonly key: string
    readonly ver: string
    readonly loc: string
    readonly ctx: 'edit' | 'preview'
    readonly path?: string
    readonly epieditmode: never
  } | {
    readonly key: never
    readonly ver: never
    readonly loc: never
    readonly ctx: never
    readonly path: never
    readonly epieditmode: 'true' | 'false'
  })
}

export type EditViewOptions<LocaleType = string> = {
  /**
   * The message to show to the editor when awaiting the data to be updated
   * in ContentGraph
   */
  refreshNotice: ComponentType<{}>

  /**
   * The layout to use when rendering a page component
   */
  layout: ComponentType<PropsWithChildren<{ locale: string }>>

  /**
   * The fourth step of the handling of a Preview/On-Page-Edit view,
   * which actually loads the data of content to be shown to the 
   * editor.
   */
  loader: GetContentByIdMethod<LocaleType>

  /**
   * The third step of the handling of a Preview/On-Page-Edit view,
   * which gets the Optimizely Graph client for the token/auth method
   * inferred by the contentResolver.
   * 
   * @param       token       The token to be used
   * @returns     The Optimizely Graph Client
   */
  clientFactory: ClientFactory

  /**
   * If provided, this allows to override the CommunicationInjector
   * path.
   */
  communicationInjectorPath: string

  /**
   * The second step of the handling of a Preview/On-Page-Edit view,
   * this actually extracts the requested content identification info
   * from the path and search params
   * 
   * @param       props       The page path props and search params
   * @returns     The requested content information
   */
  contentResolver: (props: ValidatedEditPageProps) => ContentRequest | undefined

  /**
   * This is the first step of the handling of a Preview/On-Page-Edit view,
   * where the parameters should be validated to ensure this is a correct
   * preview/on-page-edit request.
   * 
   * @param       props               The page path props and search params
   * @param       throwOnInvalid      Whether an error must thrown on invalid data
   * @param       isDevelopment       Whether this request runs in development mode
   * @returns     If the request is valid
   */
  requestValidator: (props: AwaitedEditPageProps, throwOnInvalid?: boolean, isDevelopment?: boolean) => props is ValidatedEditPageProps

  /**
   * Enforce a refresh delay in the on page editing / preview, between a signal
   * has been received from the CMS and the instruction to Next.JS to actually
   * refresh the page.
   */
  refreshTimeout?: number | false
}

type MayBe<T> = T extends Array<infer R> ? Array<R | null> | null : T | null
export type GetContentByIdData = {
  content?: MayBe<{
    items?: MayBe<Array<{
      __typename?: MayBe<string>
      _type?: MayBe<string>
    } & Record<string, any>> | ({
      __typename?: MayBe<string>
      _type?: MayBe<string>
    } & Record<string, any>)>
    total?: MayBe<number>
  }>
}
export type GetContentByIdMethod<LocaleType = string> = (client: GraphQLClient, variables: ContentQueryProps<LocaleType>) => Promise<GetContentByIdData>
