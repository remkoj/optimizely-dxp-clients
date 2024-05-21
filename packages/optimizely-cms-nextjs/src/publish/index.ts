import { type NextRequest, NextResponse } from "next/server.js"
import { revalidatePath, revalidateTag } from "next/cache.js"
import { type IOptiGraphClient, type OptimizelyGraphConfig, isContentGraphClient, type ClientFactory, ContentGraphClient } from "@remkoj/optimizely-graph-client"
import { getServerClient } from '../client.js'

type PublishScopes = NonNullable<Parameters<typeof revalidatePath>[1]>
type OptiGraphClientFactory = IOptiGraphClient | OptimizelyGraphConfig | ClientFactory
type PublishApiOptions = {
    /**
     * The list of paths that your implementation uses with Optimizely CMS managed
     * content
     */
    paths: Array<string>

    /**
     * The scopes for which to revalidate the cache
     */
    scopes?: Array<PublishScopes>

    /**
     * The tags to revalidate the cache for
     */
    tags?: Array<string>

    /**
     * The Optimizely Graph client to use for Graph Operations needed to publish 
     * content
     */
    client?: OptiGraphClientFactory
}

export function createPublishApi(options: PublishApiOptions)
{
    const defaultOptions : Required<PublishApiOptions> = {
        paths: [],
        client: getServerClient,
        scopes: ['page','layout'],
        tags: []
    }

    function tryJsonParse<T = { [key: string]: any }>(data?: string | null) : T | null
    {
        if (typeof(data) != 'string') 
            return null
        try {
            return JSON.parse(data) as T
        } catch {
            return null
        }
    }

    const { client: clientFactory, paths, scopes, tags } = { 
        ...defaultOptions, 
        ...options 
    } as Required<PublishApiOptions>
    const client = typeof clientFactory == 'function' ? clientFactory() : (isContentGraphClient(clientFactory) ? clientFactory : new ContentGraphClient(clientFactory))

    return async function(request: NextRequest) : Promise<NextResponse>
    {
        // Authorize the request
        const xAuthToken = request.headers.get("X-OPTLY-PUBLISH") ?? 
            request.nextUrl.searchParams.get("token") ?? 
            undefined
        const serverToken = client.siteInfo.publishToken
        if (!serverToken || serverToken == "") {
            console.error("[Publish-API] No authentication configured, publishing has been disabled")
            return NextResponse.json({ error: "Not authorized"}, { status: 401 })
        }
        if (serverToken != xAuthToken) {
            console.error("[Publish-API] The provided publishing token is invalid", xAuthToken)
            return NextResponse.json({ error: "Not authorized"}, { status: 401 })
        }

        // Get request data
        const requestBody = tryJsonParse(await request.text())
        console.log("[Publish-API] Graph Event: " + JSON.stringify(requestBody, undefined, 4))

        // Keep track of what has been revalidated
        const revalidated : Array<{ tag: string } | { path: string, scope: PublishScopes }> = []

        // Flush all
        scopes.forEach(scope => {
            paths.forEach(path => {
                revalidatePath(path, scope)
                revalidated.push({ path, scope })
            })
        })
        tags.forEach(tag => {
            revalidateTag(tag)
            revalidated.push({ tag })
        })

        // Return result
        return NextResponse.json({ success: true, revalidated })
    }
}

export default createPublishApi