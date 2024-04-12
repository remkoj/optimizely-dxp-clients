import type { IOptiGraphClient } from "@remkoj/optimizely-graph-client";
import type { CmsComponent, ContentLink } from "@remkoj/optimizely-cms-react";
import type { Metadata } from 'next';
export type OptimizelyNextPage<T = {}> = CmsComponent<T> & {
    getMetaData?: (contentLink: ContentLink, locale: string | null | undefined, client: IOptiGraphClient) => Promise<Metadata>;
};
