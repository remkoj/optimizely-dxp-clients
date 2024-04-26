/// <reference types="react" />
import 'server-only';
import type { Metadata, ResolvingMetadata } from 'next';
import { type Route, type ClientFactory, type ChannelDefinition } from '@remkoj/optimizely-graph-client';
import { type ComponentFactory } from '@remkoj/optimizely-cms-react/rsc';
import { type GetContentByPathMethod } from './data';
export type DefaultCmsPageParams = {
    path?: string[];
    lang?: string;
};
export type DefaultCmsPageSearchParams = {};
export type DefaultCmsPageProps<TParams extends Record<string, string | Array<string> | undefined> = DefaultCmsPageParams, TSearchParams extends Record<string, string | Array<string> | undefined> = DefaultCmsPageSearchParams> = {
    params: TParams;
    searchParams: TSearchParams;
};
export type OptiCmsNextJsPage<TParams extends Record<string, string | Array<string> | undefined> = DefaultCmsPageParams, TSearchParams extends Record<string, string | Array<string> | undefined> = DefaultCmsPageSearchParams> = {
    generateStaticParams: () => Promise<TParams[]>;
    generateMetadata: (props: DefaultCmsPageProps<TParams, TSearchParams>, resolving: ResolvingMetadata) => Promise<Metadata>;
    CmsPage: (props: DefaultCmsPageProps<TParams, TSearchParams>) => Promise<JSX.Element>;
};
export declare enum SystemLocales {
    All = "ALL",
    Neutral = "NEUTRAL"
}
export type CreatePageOptions<LocaleEnum = SystemLocales, TParams extends Record<string, string | Array<string> | undefined> = DefaultCmsPageParams, TSearchParams extends Record<string, string | Array<string> | undefined> = DefaultCmsPageSearchParams> = {
    defaultLocale: LocaleEnum | null;
    getContentByPath: GetContentByPathMethod<LocaleEnum>;
    client: ClientFactory;
    channel?: ChannelDefinition;
    propsToCmsPath: (props: DefaultCmsPageProps<TParams, TSearchParams>) => string | null;
    propsToCmsLocale: (props: DefaultCmsPageProps<TParams, TSearchParams>, locale: LocaleEnum | null) => LocaleEnum | null;
    routeToParams: (route: Route) => TParams;
};
/**
 * Generate the React Server Side component and Next.JS functions needed to render an
 * Optimizely CMS page. This component assumes that the routes are either defined as
 * /[lang]/[[...path]] or /[[...path]]
 *
 * @param       factory         The component factory to use for this page
 * @param       options         The page component generation options
 * @returns     The Optimizely CMS Page
 */
export declare function createPage<LocaleEnum = SystemLocales, TParams extends Record<string, string | Array<string> | undefined> = DefaultCmsPageParams, TSearchParams extends Record<string, string | Array<string> | undefined> = DefaultCmsPageSearchParams>(factory: ComponentFactory, options?: Partial<CreatePageOptions<LocaleEnum, TParams, TSearchParams>>): OptiCmsNextJsPage;
