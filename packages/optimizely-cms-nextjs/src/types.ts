import type { IOptiGraphClient } from "@remkoj/optimizely-graph-client"
import type { CmsComponent } from "@remkoj/optimizely-cms-react"
import type { ContentLink } from "@remkoj/optimizely-graph-client"
import type { Metadata } from 'next'

export type OptimizelyNextPage<T = {}, L extends Record<string, unknown> = Record<string, unknown>> = CmsComponent<T, L> & 
{
    getMetaData?: (contentLink: ContentLink, locale: string | null | undefined, client: IOptiGraphClient) => Promise<Metadata>
}
