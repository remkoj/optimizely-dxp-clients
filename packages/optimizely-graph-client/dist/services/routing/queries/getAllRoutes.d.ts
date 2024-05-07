export type Route = {
    _metadata: {
        key: string;
        version: string;
        locale: string;
        displayName: string;
        types: Array<string>;
        url: {
            path: string;
            domain: string;
        };
        slug?: string | null;
    };
    changed: string;
};
export type Result = {
    Content: {
        items: Route[];
        cursor: string;
        total: number;
    };
};
export type Variables = {
    cursor?: string;
    pageSize?: number;
    typeFilter?: string | string[];
    domain?: string;
};
export declare const query: string;
