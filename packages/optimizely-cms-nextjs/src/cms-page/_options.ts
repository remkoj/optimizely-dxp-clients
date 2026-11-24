
import { type IOptiGraphClient } from '@remkoj/optimizely-graph-client/client';
import { RouteResolver, type IRouteResolver, type Route } from '@remkoj/optimizely-graph-client/router';
import { type ChannelDefinition } from '@remkoj/optimizely-graph-client/channels';
import { isNonEmptyString } from '@remkoj/optimizely-cms-react/rsc';

// From within this package
import { createNextJsClient as createClient, NextJsClientFactory } from '../client.js'

// Import from internal sub modules
import type { GetContentByPathMethod, GetMetaDataByPathMethod } from './data.js';
import { SystemLocales } from './_base.js';
import { urlToPath } from './utils.js'
import type { 
  DefaultCmsPageParams, 
  DefaultCmsPageProps,
  DefaultCmsPageSearchParams
} from './_types.js';

export type CreatePageOptions<
  LocaleEnum = SystemLocales,
  TParams extends Record<
    string,
    string | Array<string> | undefined
  > = DefaultCmsPageParams,
  TSearchParams extends Record<
    string,
    string | Array<string> | undefined
  > = DefaultCmsPageSearchParams,
> = {
  /**
   * Main function used to retrieve the content by path
   */
  getContentByPath?: GetContentByPathMethod<LocaleEnum>

  /**
   * The factory that should yield the GraphQL Client to be used within this
   * page.
   *
   * @param token   The token retrieved by the CMS Page from the context, always undefined
   * @param scope   The scope in which the client is being created, this allows for checking
   *                draftMode in configuring the client
   * @returns       The client instance
   */
  client:
    IOptiGraphClient |
    NextJsClientFactory

  /**
   * The channel information used to resolve locales, domains and more.
   *
   * If provided with a string value, this is assumed to be the Application/Website identifier
   * for the deployment (Base URL ***without trailing slash*** for SaaS CMS; Website GUID for
   * CMS 12).
   */
  channel?: ChannelDefinition | string

  /**
   * Override the default RouteResolver that is used to discover the routes
   * provided by the Optimizely CMS and to retrieve the content reference for
   * each route.
   *
   * @param       client      The Optimizely GraphQL Client to use
   * @returns     The RouteResolver to use
   */
  routerFactory: (client?: IOptiGraphClient) => IRouteResolver

  /**
   * Take the props received by the CmsPage from Next.JS and tranform those
   * into a path that will be understood by Optimizely CMS. The default
   * implementation works with both `/[lang]/[[...path]]` as well as
   * `/[[...path]]`
   *
   * @param       props       The Properties (slugs & search params) received
   *                          by Next.JS
   * @return      The path to be retrieved from Router or getContentByPath
   *              function
   */
  propsToCmsPath: (
    props: DefaultCmsPageProps<TParams, TSearchParams>,
    channel?: ChannelDefinition
  ) => Promise<string | null>

  /**
   * Take the props received by the CmsPage from Next.JS and tranform those
   * into a the page variant used by the CMS.
   *
   * @param       props       The Properties (slugs & search params) received
   *                          by Next.JS
   * @return      The path to be retrieved from Router or getContentByPath
   *              function
   */
  propsToVariant: (
    props: DefaultCmsPageProps<TParams, TSearchParams>,
    channel?: ChannelDefinition
  ) => Promise<string | null | undefined>

  /**
   * Take the route from the Routing Service and transform that to the route
   * params used by Next.JS. The default implementation assumes that the CMS
   * routes will be handled by `/[[...path]]`
   *
   * @param       route       The Route retrieved from Optimizely Graph
   * @returns     The processed route
   */
  routeToParams: (route: Route) => TParams

  /**
   * Takes the Next.JS route segments and try to transform it into an initial
   * locale code, the default implementation will try to resolve the `lang`
   * route segment using the channel definition.
   *
   * @param       slugs       The slugs to resolve
   * @returns     The resolved locale
   */
  paramsToLocale: (
    params?: Promise<TParams | undefined>,
    channel?: ChannelDefinition
  ) => Promise<string | undefined>
}

export type CreateLayoutOptions<
  LocaleEnum = SystemLocales,
  TParams extends Record<
    string,
    string | Array<string> | undefined
  > = DefaultCmsPageParams
> = Pick<
  CreatePageOptions<LocaleEnum, TParams, DefaultCmsPageSearchParams>, 
  'paramsToLocale' | 'propsToCmsPath' | 'client' | 'channel' | 'propsToVariant'> & 
{
  toValidatedLocale?: 
    ((
      initialLocale: string | null | undefined, 
      channel?: ChannelDefinition,
      client?: IOptiGraphClient
    ) => LocaleEnum | LocaleEnum[] | undefined) | 
    ((
      initialLocale: string | null | undefined,
      channel?: ChannelDefinition,
      client?: IOptiGraphClient
    ) => Promise<LocaleEnum | LocaleEnum[] | undefined>)

  getMetaDataByPath?: GetMetaDataByPathMethod<LocaleEnum>
}

type MakeRequired<T, K extends keyof T> = Omit<T, K> & Pick<Required<T>, K>

type FullCreateLayoutOptions<
  LocaleEnum = SystemLocales,
  TParams extends Record<
    string,
    string | Array<string> | undefined
  > = DefaultCmsPageParams
> = MakeRequired<CreateLayoutOptions<LocaleEnum, TParams>, 'toValidatedLocale'>

type SupportedPageParams = {
  path?: string[]
  lang?: string
}

const DefaultCreatePageOptions: CreatePageOptions<string> = {

  client: createClient,

  routerFactory: (client) => new RouteResolver(client),

  async propsToCmsPath(props) {
    const params : SupportedPageParams = await props.params; // Read the parameters
    const slugs = [ params.lang, ...(params.path ?? [])] // Build the full set of slugs for the path
      .filter(isNonEmptyString) // Remove empty values
      .filter((x) => !x.startsWith(encodeURIComponent('var:'))) // Remove any variant specification
      .map((x) => decodeURIComponent(x)); // Decode the URI components

    if (slugs.length === 0) return '/'; // We're requesting the homepage, so just return that path

    // Build the URL
    const fullPath = !slugs[slugs.length - 1].includes('.') ? '/' + slugs.join('/') + '/' : '/' + slugs.join('/');
    return fullPath;
  },

  async propsToVariant({ params }) {
    const pathSegments = (await params).path
    const variantPrefix = encodeURIComponent('var:');
    const variantSegment = Array.isArray(pathSegments) ? pathSegments.filter(x => typeof x === 'string' && x.startsWith(variantPrefix)).at(0) : undefined
    return variantSegment ? variantSegment.substring(variantPrefix.length) : undefined
  },

  routeToParams(route) {
    const pathSegments = urlToPath(route.url)
    if (route.variation)
      pathSegments.push(`var:${ route.variation }`)
    return { path: pathSegments, lang: route.locale }
  },

  async paramsToLocale(params, channel) {
    // If there's no channel, just return undefined
    if (!channel) return undefined

    // Check if we have a language, and if so, resolve based upon that language
    const lang = (
      (await params) as Record<string, string | string[] | undefined>
    )?.lang
    const toTest = Array.isArray(lang) ? lang.at(0) : lang
    if (toTest)
      return channel.slugToLocale(toTest.toString()) ?? channel.defaultLocale

    // Check if we have a path, and if so, resolve based upon the first slug in the path
    const path = (
      (await params) as Record<string, string | string[] | undefined>
    )?.path
    const firstSlug = Array.isArray(path) ? path.at(0) : path
    if (firstSlug)
      return channel.slugToLocale(firstSlug) ?? channel.defaultLocale

    // We have neither a language, nor a slug, return the default
    return channel.defaultLocale
  },
}

const DefaultCreateLayoutOptions: FullCreateLayoutOptions = {
  client: DefaultCreatePageOptions.client,
  paramsToLocale: DefaultCreatePageOptions.paramsToLocale,
  propsToCmsPath: DefaultCreatePageOptions.propsToCmsPath,
  propsToVariant: DefaultCreatePageOptions.propsToVariant,
  toValidatedLocale: (initialLocale?: string | null) => {
    return initialLocale ? (initialLocale as SystemLocales) : undefined;
  }
}

export function withPageDefaults<
  LocaleEnum = SystemLocales,
  TParams extends Record<
    string,
    string | Array<string> | undefined
  > = DefaultCmsPageParams,
  TSearchParams extends Record<
    string,
    string | Array<string> | undefined
  > = DefaultCmsPageSearchParams,
>(pageConfig?: Partial<CreatePageOptions<LocaleEnum, TParams, TSearchParams>>): 
CreatePageOptions<LocaleEnum, TParams, TSearchParams>
{
  return {
    ...DefaultCreatePageOptions,
    ...pageConfig
  } as CreatePageOptions<LocaleEnum, TParams, TSearchParams>
}

export function withLayoutDefaults<
  LocaleEnum = SystemLocales,
  TParams extends Record<
    string,
    string | Array<string> | undefined
  > = DefaultCmsPageParams,
>(layoutConfig?: Partial<CreateLayoutOptions<LocaleEnum, TParams>>): 
FullCreateLayoutOptions<LocaleEnum, TParams>
{
  return {
    ...DefaultCreateLayoutOptions,
    ...layoutConfig
  } as FullCreateLayoutOptions<LocaleEnum, TParams>
}