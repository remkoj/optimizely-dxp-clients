import { type Route } from "./getAllRoutes.js";
export type Variables = {
    path: string;
    domain?: string | null;
};
export type Result = {
    Content: {
        total: number;
        items: Route[];
    };
};
export declare const query: string;
