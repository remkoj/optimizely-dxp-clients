import { type NextRequest, NextResponse } from 'next/server'
import { type IOptiGraphClient } from "@remkoj/optimizely-graph-client"
import { getServerClient } from '../client'
import { revalidatePath } from 'next/cache'

export type PublishApiResponse = {
    status: "success" | "no-publish",
    paths?: string[]
} | { error: string }

const editPaths = [ '/ui/[[...path]]' ]
const publishedPaths = [ '/[lang]', '/[lang]/[[...path]]', '/sitemap', '/sitemap.xml' ]
const paths = [ ...editPaths, ...publishedPaths ]

export function createPublishApi(client?: IOptiGraphClient)
{
    const graphClient = client ?? getServerClient()

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

    const publishHandler : (req: NextRequest) => Promise<NextResponse<PublishApiResponse>> = async req =>
    {
        // Validate access
        const xAuthToken = req.headers.get("X-OPTLY-PUBLISH") ?? 
            req.nextUrl.searchParams.get("token") ?? 
            undefined
        const serverToken = graphClient.siteInfo.publishToken
        if (!serverToken || serverToken == "") {
            console.error("No authentication configured, publishing has been disabled")
            return NextResponse.json({ error: "Not authorized"}, { status: 401 })
        }
        if (serverToken != xAuthToken) {
            console.error("[Publish-API] The provided publishing token is invalid", xAuthToken)
            return NextResponse.json({ error: "Not authorized"}, { status: 401 })
        }

        // Get request data
        const requestBody = tryJsonParse(await req.text())

        // Don't publish if we're in selective mode and there's no data
        if (!requestBody) {
            console.log("Not flushing due to missing request body")
            return NextResponse.json({ status: "no-publish" })
        }
    
        const action = requestBody.type?.action
        const subject = requestBody.type?.subject    

        // Only publish on updated documents
        if (subject != "doc" || action != "updated") {
            console.log("Not flushing due to incorrect subject or type", JSON.stringify(requestBody))
            return NextResponse.json({ status: "no-publish" })
        }

        paths.forEach(p => revalidatePath(p, 'page'))
        console.log("Publishing => Revalidated (paths)", paths)
        return NextResponse.json({ status: "success", paths })
    }

    return publishHandler
}

export default createPublishApi