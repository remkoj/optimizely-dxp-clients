import { type PropsWithChildren, type ReactNode } from "react";
import { type Metadata, type ResolvingMetadata } from "next";
import type { ChannelDefinition, ClientFactory } from "@remkoj/optimizely-graph-client";
import type { DefaultCmsPageProps } from './page';
import { type GetMetaDataByPathMethod } from './data';
export type CmsPageLayout = {
    generateMetadata: (props: Omit<DefaultCmsPageProps, 'searchParams'>, resolving: ResolvingMetadata) => Promise<Metadata>;
    PageLayout: (props: PropsWithChildren<Omit<DefaultCmsPageProps, 'searchParams'>>) => JSX.Element | ReactNode;
};
export type CreateLayoutOptions = {
    defaultLocale: string | null;
    getMetaDataByPath: GetMetaDataByPathMethod;
    client: ClientFactory;
    channel?: ChannelDefinition;
};
export declare function createLayout(options?: Partial<CreateLayoutOptions>): CmsPageLayout;
export default createLayout;
