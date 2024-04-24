import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { isContentGraphClient, ContentGraphClient } from "@remkoj/optimizely-graph-client";
import { getServerClient } from '../client';
export function createPublishApi(options) {
    const defaultOptions = {
        paths: [],
        client: getServerClient,
        scopes: ['page', 'layout'],
        tags: []
    };
    function tryJsonParse(data) {
        if (typeof (data) != 'string')
            return null;
        try {
            return JSON.parse(data);
        }
        catch {
            return null;
        }
    }
    const { client: clientFactory, paths, scopes, tags } = {
        ...defaultOptions,
        ...options
    };
    const client = typeof clientFactory == 'function' ? clientFactory() : (isContentGraphClient(clientFactory) ? clientFactory : new ContentGraphClient(clientFactory));
    return async function (request) {
        // Authorize the request
        const xAuthToken = request.headers.get("X-OPTLY-PUBLISH") ??
            request.nextUrl.searchParams.get("token") ??
            undefined;
        const serverToken = client.siteInfo.publishToken;
        if (!serverToken || serverToken == "") {
            console.error("[Publish-API] No authentication configured, publishing has been disabled");
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }
        if (serverToken != xAuthToken) {
            console.error("[Publish-API] The provided publishing token is invalid", xAuthToken);
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }
        // Get request data
        const requestBody = tryJsonParse(await request.text());
        console.log("[Publish-API] Graph Event: " + JSON.stringify(requestBody, undefined, 4));
        // Keep track of what has been revalidated
        const revalidated = [];
        // Flush all
        scopes.forEach(scope => {
            paths.forEach(path => {
                revalidatePath(path, scope);
                revalidated.push({ path, scope });
            });
        });
        tags.forEach(tag => {
            revalidateTag(tag);
            revalidated.push({ tag });
        });
        // Return result
        return NextResponse.json({ success: true, revalidated });
    };
}
export default createPublishApi;
//# sourceMappingURL=index.js.map