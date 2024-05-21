export declare function useCookie<T extends string | undefined>(cookieName: string, defaultValue?: T): [
    T extends string ? string : string | undefined,
    (newValue: T extends string ? string | undefined : string) => void,
    () => void
];
/**
 * Try fetching the DOM Document, returning null if the current DOM Document
 * cannot be found (e.g. server side)
 *
 * @returns     The Document or undefined when on server side
 */
export declare const useDocument: () => Document | undefined;
