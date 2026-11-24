import type { JSX } from 'react';
import type { ResolvingMetadata, Metadata } from 'next';

/**
 * Route parameters used by the default catch-all CMS page.
 */
export type DefaultCmsPageParams = {
  /** The optional path segments captured by the catch-all route. */
  path?: string[]
}

/**
 * Query-string parameters used by a default CMS page.
 *
 * Each parameter may be omitted, supplied once, or supplied multiple times.
 */
export type DefaultCmsPageSearchParams = Record<string, string | string[] | undefined>

/**
 * Props supplied to a CMS page by Next.js.
 *
 * @typeParam TParams - The route parameter shape.
 * @typeParam TSearchParams - The query-string parameter shape.
 */
export type DefaultCmsPageProps<
  TParams extends Record<
    string,
    string | Array<string> | undefined
  > = DefaultCmsPageParams,
  TSearchParams extends Record<
    string,
    string | Array<string> | undefined
  > = DefaultCmsPageSearchParams,
> = {
  /** Route parameters resolved asynchronously by Next.js. */
  params: Promise<TParams>
  /** Query-string parameters resolved asynchronously by Next.js. */
  searchParams: Promise<TSearchParams>
}

/**
 * Next.js page exports generated for an Optimizely CMS route.
 *
 * @typeParam TParams - The route parameter shape.
 * @typeParam TSearchParams - The query-string parameter shape.
 */
export type OptiCmsNextJsPage<
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
   * Generates the route parameters for pages to prerender.
   *
   * @returns The route parameters for pages that should be prerendered.
   */
  generateStaticParams: () => Promise<TParams[]>

  /**
   * Generates metadata for the current route.
   *
   * @param props - The route and query-string properties of the page.
   * @param resolving - The metadata currently being resolved by Next.js.
   * @returns The metadata for the route, either directly or asynchronously.
   */
  generateMetadata: (
    props: DefaultCmsPageProps<TParams, TSearchParams>,
    resolving: ResolvingMetadata
  ) => Promise<Metadata> | Metadata

  /**
   * Renders the CMS page for the current route.
   *
   * @param props - The route and query-string properties of the page.
   * @returns The rendered page element.
   */
  CmsPage: (
    props: DefaultCmsPageProps<TParams, TSearchParams>
  ) => Promise<JSX.Element>
}
