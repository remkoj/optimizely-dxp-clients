/// <reference types="react" />
import 'server-only';
import type { Metadata, ResolvingMetadata } from 'next';
import { type ClientFactory, type ChannelDefinition } from '@remkoj/optimizely-graph-client';
import { type ComponentFactory } from '@remkoj/optimizely-cms-react/rsc';
import { type GetContentByPathMethod } from './data';
export type Params = {
    path: string[] | undefined;
};
export type Props = {
    params: Params;
    searchParams: {};
};
export type GenerateMetadataProps<TParams extends {} = {}, TSearch extends {} = {}> = {
    params: Params;
};
export type OptiCmsNextJsPage = {
    generateStaticParams: () => Promise<Params[]>;
    generateMetadata: (props: Props, resolving: ResolvingMetadata) => Promise<Metadata>;
    CmsPage: (props: Props) => Promise<JSX.Element>;
};
export declare enum SystemLocales {
    All = "ALL",
    Neutral = "NEUTRAL"
}
export type CreatePageOptions<LocaleEnum = SystemLocales> = {
    defaultLocale: string | null;
    getContentByPath: GetContentByPathMethod<LocaleEnum>;
    client: ClientFactory;
    channel?: ChannelDefinition;
};
export declare function createPage<LocaleEnum = SystemLocales>(factory: ComponentFactory, options?: Partial<CreatePageOptions<LocaleEnum>>): OptiCmsNextJsPage;
