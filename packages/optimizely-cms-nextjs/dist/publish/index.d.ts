import { type NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { type IOptiGraphClient, type OptimizelyGraphConfig, type ClientFactory } from "@remkoj/optimizely-graph-client";
type PublishScopes = NonNullable<Parameters<typeof revalidatePath>[1]>;
type OptiGraphClientFactory = IOptiGraphClient | OptimizelyGraphConfig | ClientFactory;
type PublishApiOptions = {
    /**
     * The list of paths that your implementation uses with Optimizely CMS managed
     * content
     */
    paths: Array<string>;
    /**
     * The scopes for which to revalidate the cache
     */
    scopes?: Array<PublishScopes>;
    /**
     * The tags to revalidate the cache for
     */
    tags?: Array<string>;
    /**
     * The Optimizely Graph client to use for Graph Operations needed to publish
     * content
     */
    client?: OptiGraphClientFactory;
};
export declare function createPublishApi(options: PublishApiOptions): (request: NextRequest) => Promise<NextResponse>;
export default createPublishApi;
