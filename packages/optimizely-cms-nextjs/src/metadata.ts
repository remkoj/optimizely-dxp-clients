import { type ComponentFactory } from '@remkoj/optimizely-cms-react'
import createClient, { isOptiGraphClient, type OptimizelyGraphConfig, type IOptiGraphClient, type ContentLink } from '@remkoj/optimizely-graph-client'
import { Metadata } from 'next'
import { isOptimizelyNextPageWithMetaData } from './page.js'
import { type FunctionComponent } from 'react'

export class MetaDataResolver
{
    private _cgClient : IOptiGraphClient

    public constructor(clientOrConfig?: OptimizelyGraphConfig | IOptiGraphClient)
    {
        this._cgClient = isOptiGraphClient(clientOrConfig) ? clientOrConfig : createClient(clientOrConfig)
    }

    /**
     * Resolve the meta data for a component, if it has a meta-data method exposed.
     * 
     * @param factory       The component factory used to load the component
     * @param contentLink   The link to the component for which the meta-data should be retrieved
     * @param contentType   The content type of the component
     * @param locale        The locale to be used, in a ContentGraph locale format
     * @returns             A Promise for the metadata of the given content type & instance
     */
    public async resolve(factory: ComponentFactory, contentLink: ContentLink, contentType: string[], locale?: string | null): Promise<Metadata>
    {
        if (this._cgClient.debug)
            console.log(`⚪ [MetaDataResolver] Resolving metadata for: ${ JSON.stringify({contentLink, contentType, locale})}`)

        if (locale && locale.includes("-"))
            throw new Error("🟠 [MetaDataResolver] Invalid character detected within the locale")

        const Component = factory.resolve(contentType) as FunctionComponent<any>
        if (!Component) {
            if (this._cgClient.debug)
                console.log(`🟠 [MetaDataResolver] No component found for ${ contentType.join('/') }`)
            return {}
        }
        if (this._cgClient.debug)
            console.log(`⚪ [MetaDataResolver] Using component ${ Component.displayName ?? 'Unnamed component' }`)

        if (isOptimizelyNextPageWithMetaData(Component) && Component.getMetaData) {
            if (this._cgClient.debug)
                console.log("⚪ [MetaDataResolver] Component for content type has 'getMetaData, invoking...")
            const meta = await Component.getMetaData(contentLink, locale, this._cgClient)
            if (this._cgClient.debug)
                console.log(`⚪ [MetaDataResolver] Resolved metadata to: ${ JSON.stringify(meta) }`)
            return meta
        } else {
            if (this._cgClient.debug)
                console.warn(`🟠 [MetaDataResolver] Resolved component for ${ contentType.join('/') } does not provide additional metadata`)
        }
        return {}
    }
}

export default MetaDataResolver