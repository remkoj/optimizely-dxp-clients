import { isNonEmptyString } from "../../utilities.js"

/**
 * Resolve and normalize the content type for a call to a CmsContent component.
 * 
 * When the contentType provided is invalid, it will try to resolve the 
 * contentType from the fragmentData, if provided.
 * 
 * @param       contentType         The content type received by the CmsContent 
 *                                  component
 * @param       fragmentData        The data received to render the CmsContent
 * @returns     The content type
 */
export function resolveContentType(contentType: string | (string | null)[] | null | undefined, fragmentData?: {[fieldname: string]: any}) : string[] | undefined
{
    if (Array.isArray(contentType)) {
        const filtered = contentType.filter(isNonEmptyString)
        if (filtered.length > 0)
            return filtered
    } else if (typeof(contentType) == 'string' && contentType.length > 0)
        return contentType.split("/")
    
    if (fragmentData) {
        const metaTypes = fragmentData._metadata?.types
        if (metaTypes && Array.isArray(metaTypes))
            return resolveContentType(metaTypes)
    }

    return undefined
}

export default resolveContentType