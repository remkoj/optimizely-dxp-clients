import { type NextRequest, NextResponse } from 'next/server';
import { type IOptiGraphClient } from "@remkoj/optimizely-graph-client";
export type PublishApiResponse = {
    status: "success" | "no-publish";
    paths?: string[];
} | {
    error: string;
};
export declare function createPublishApi(client?: IOptiGraphClient): (req: NextRequest) => Promise<NextResponse<PublishApiResponse>>;
export default createPublishApi;
