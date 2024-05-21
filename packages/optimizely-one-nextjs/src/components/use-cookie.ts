import { useCallback, useMemo } from "react"

export function useCookie<T extends string | undefined>(cookieName: string, defaultValue?: T) : 
[ 
    T extends string ? string : string | undefined, 
    (newValue: T extends string ? string | undefined : string) => void, 
    () => void 
] {
    const doc = useDocument()
    const cv = useMemo<T extends string ? string : string | undefined>(() => {
        if (!doc)
            return defaultValue as T extends string ? string : string | undefined
        const cookieData = doc.cookie.split(';').map(x => x.trim().split('=', 2).map(x => decodeURIComponent(x))) as Array<[string,string]>
        const cookie : [string,string]|undefined = cookieData.filter(x => x[0] == cookieName)[0]
        const val = (cookie ? cookie[1] ?? defaultValue : defaultValue) as T extends string ? string : string | undefined
        return val
    }, [ cookieName, defaultValue, doc ])

    const sc = useCallback((newValue: T extends string ? string | undefined : string) => {
        if (!doc) return
        const cookieString = `${ encodeURIComponent(cookieName) }=${ encodeURIComponent(newValue ?? defaultValue ?? '')}`
        doc.cookie = cookieString
    }, [ cookieName, doc ])

    const rc = useCallback(() => {
        if (!doc) return
        const cookieString = `${ encodeURIComponent(cookieName) }=`
        doc.cookie = cookieString
    }, [ cookieName, doc ])

    return [cv, sc, rc]
}

/**
 * Try fetching the DOM Document, returning null if the current DOM Document
 * cannot be found (e.g. server side)
 * 
 * @returns     The Document or undefined when on server side
 */
export const useDocument = () =>
{
    try {
        return window.document
    } catch {
        return undefined
    }
}

export default useCookie