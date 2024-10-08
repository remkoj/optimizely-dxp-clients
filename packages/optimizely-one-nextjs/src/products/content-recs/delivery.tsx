'use client'
import { useMemo, useEffect, useState, useId, type FunctionComponent } from "react"
import { usePathname } from "next/navigation"

function getFullUrl()
{
    try {
        return window.location.href
    } catch {
        return undefined
    }
}

export type ContentRecsItemData = {
    id: string
    title: string
    abstract: string
    featured: boolean
    approved: string
    read: boolean
    published: null
    original_url: string
    metadata: Record<string, string | Record<string, string | Record<string,string>>>
    topics?: Array<{
        id: string
        title: string
        full_details_url: string
    }>
    link_url: string
    full_details_url: string
    main_image_url: string
    main_image: {
        width: string
        height: string
    }
    source: {
        id: string
        full_details_url: string
        title: string
        display: string
    }
    author: null | string
}

export type ContentRecsResponse = {
    group: string
    model: boolean | string
    next_page: string
    recommendation_id: string
    total_hits: number
    content: Array<ContentRecsItemData> 
}

export type ContentRecsItem = FunctionComponent<{ data: ContentRecsItemData }>
export type ContentRecsItemPlaceholder = FunctionComponent

/**
 * Insert a block of Content Recommendations
 * 
 * @param param0 
 * @returns 
 */
export const ContentRecsDelivery : FunctionComponent<ContentRecsDeliveryProps> = ({ apiKey, className, template: ItemTpl, count = 10, endpoint = '/api/me/crecs', placeholder: ItemPlaceholder }) =>
{
    const id = useId()
    const [ data, setData ] = useState<ContentRecsResponse | undefined>(undefined)
    const [ pageUrl, setPageUrl ] = useState<string | undefined>(undefined)
    const path = usePathname()

    // Make sure we only load the recommendations client side
    useEffect(() => {
        console.log(`💭 Enabling recommendations widget ${ apiKey } on page ${path}`)
        setPageUrl(getFullUrl())
    }, [ path, apiKey ])

    // Build the service URL that will yield the recommendations
    const serviceUrl = useMemo(() => {
        if (!pageUrl)
            return undefined
        const search = new URLSearchParams()
        search.set('include_topics','')
        search.set('key', apiKey)
        search.set('session[]', pageUrl)
        if (count) search.set('rpp', count.toString())
        return endpoint + '?' + search.toString()
    }, [ apiKey, count, endpoint, pageUrl ])

    // Run the actual request for the recommendations
    useEffect(() => {
        if (!serviceUrl) return
        console.log(`💭 Fetching recommendations for widget ${ apiKey }`)
        const abort = new AbortController()
        fetch(serviceUrl, { signal: abort.signal, cache: 'no-store' })
            .then(r => r.json())
            .then(d => setData(d))
            .catch(() => setData(undefined))
        return () => {
            abort.abort("Refreshing component")
        }
    }, [ serviceUrl ])

    // Make sure placeholders are rendered while loading
    if (!data && ItemPlaceholder)
        return <div className={ "optimizely-recs "+className } data-recs-widget={ apiKey } data-recs-id={ "loading-"+id }>
            {(Array.from({ length: count }, (v,k) => {
                const itemKey = `${ id }-placeholder-${ k }`
                return <ItemPlaceholder key={itemKey} />
            }))}
        </div>
    

    // Render the actual recommendations
    return <div className={ "optimizely-recs "+className } data-recs-widget={ apiKey } data-recs-id={ data?.recommendation_id || "loading-"+id }>
        { (data?.content || []).map(item => {
            const itemKey = `${ id }-${data?.recommendation_id || ''}-${ item.id || ''}`
            return <ItemTpl key={itemKey} data={ item } />
        })}
    </div>
}

export type ContentRecsDeliveryProps = {
    /**
     * The API Key of the web delivery used for these recommendations. This is
     * shown as the value for "data-api-key" within the Content Recs delivery
     * instructions
     */
    apiKey: string

    /**
     * The CSS Classes tot apply to the container, in addition to the 
     * "idio-recommendations" CSS Class
     */
    className?: string

    /**
     * The item template to be used to render an individual item
     */
    template: ContentRecsItem

    /**
     * The component to show for each recommendation slot whilest the actual
     * recommendations are still loading
     */
    placeholder?: ContentRecsItemPlaceholder

    /**
     * The number of recommendations to fetch and render, defaults to 10
     */
    count?: number

    /**
     * Set the endpoint to be used for the Content Recommendations API, this
     * defaults to the proxy included in the Optimizely One Package. It assumes
     * the default prefix of /api/me to be used. 
     */
    endpoint?: string
}

export default ContentRecsDelivery