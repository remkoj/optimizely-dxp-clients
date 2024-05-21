import { useCallback, useMemo } from "react";
export function useCookie(cookieName, defaultValue) {
    const doc = useDocument();
    const cv = useMemo(() => {
        if (!doc)
            return defaultValue;
        const cookieData = doc.cookie.split(';').map(x => x.trim().split('=', 2).map(x => decodeURIComponent(x)));
        const cookie = cookieData.filter(x => x[0] == cookieName)[0];
        const val = (cookie ? cookie[1] ?? defaultValue : defaultValue);
        return val;
    }, [cookieName, defaultValue, doc]);
    const sc = useCallback((newValue) => {
        if (!doc)
            return;
        const cookieString = `${encodeURIComponent(cookieName)}=${encodeURIComponent(newValue ?? defaultValue ?? '')}`;
        doc.cookie = cookieString;
    }, [cookieName, doc]);
    const rc = useCallback(() => {
        if (!doc)
            return;
        const cookieString = `${encodeURIComponent(cookieName)}=`;
        doc.cookie = cookieString;
    }, [cookieName, doc]);
    return [cv, sc, rc];
}
/**
 * Try fetching the DOM Document, returning null if the current DOM Document
 * cannot be found (e.g. server side)
 *
 * @returns     The Document or undefined when on server side
 */
export const useDocument = () => {
    try {
        return window.document;
    }
    catch {
        return undefined;
    }
};
export default useCookie;
//# sourceMappingURL=use-cookie.js.map