import { type Route } from "./getAllRoutes.js";
export type Variables = {
    key: string;
    version?: string | null;
    locale?: Array<string | null> | string | null;
};
export type Result = {
    Content: {
        total: number;
        items: Route[];
    };
};
export declare const query: string;
