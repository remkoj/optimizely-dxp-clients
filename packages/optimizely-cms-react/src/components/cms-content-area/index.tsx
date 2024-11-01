import type { ElementType } from '../type-utils.js'
import * as Utils from '../../utilities.js'
import * as Errors from '../../errors.js'
import { normalizeContentLinkWithLocale, contentLinkToString } from '@remkoj/optimizely-graph-client/utils'
import type { BaseCmsContentAreaProps, ContentAreaItemDefinition, ValidContentAreaItemDefinition } from './types.js'

//#region Export Type definitions
export type { CmsContentAreaClassMapper, CmsContentAreaProps, ContentAreaItemDefinition, CmsContentAreaComponent } from './types.js'
//#endregion

/**
 * React server component to render a content area
 * 
 * @param       param0      The content area information for rendering
 * @returns 
 */
export const CmsContentArea = <T extends ElementType = "div", I extends ElementType = "div">({ 
    items, 
    classMapper, 
    className, 
    fieldName, 
    as: elementType, 
    itemsProperty, 
    itemWrapper, 
    
    ctx,
    cmsContent: CmsContent,

    ...additionalProps
}: BaseCmsContentAreaProps<T,I>) : JSX.Element => {
    const { inEditMode = false } = ctx

    // Convert the items to a list of enriched content types and filter out items cannot be loaded
    const actualItems = (items || []).filter(forValidContentAreaItems)
    const componentData = actualItems.map((item, idx) => {
        // Prepare data from received content area format
        const contentLink = normalizeContentLinkWithLocale(item._metadata)
        if (!contentLink)
            throw new Errors.InvalidContentLinkError(item._metadata)
        const contentType = Utils.normalizeContentType(item._metadata.types)
        const fragmentData = item

        // Read element wrapper configuration
        const { 
            as: contentItemElement, 
            className: contentItemBaseClassName,
            itemsProperty: contentItemTarget, 
            ...contentItemElementProps 
        } = itemWrapper ?? {}

        // Generate element wrapper properties
        const contentAreaItemContainerKey = `ContentAreaItem-${ idx }-${ contentLinkToString(contentLink) }`
        const contentAreaItemContainerProps : any = {
            className: `opti-content-area-item opti-content-area-item-${idx}${ contentItemBaseClassName ? ' ' + contentItemBaseClassName : '' } ${classMapper ? classMapper(item.displayOption ?? 'default', contentType ?? null, idx) : ""}`,
            "data-epi-block-id": inEditMode && fieldName ? Utils.getContentEditId(contentLink) || undefined : undefined,
            "data-displayoption": item.displayOption || undefined,
            "data-tag": item.tag || undefined,
            ...contentItemElementProps
        }
        const contentAraeItemContent : JSX.Element = <CmsContent contentLink={contentLink} contentType={ contentType } fragmentData={ fragmentData } contentTypePrefix="Component" />

        // Inject the element into the wrapper
        const childrenTarget = contentItemTarget || "children"
        let contentAreaItemContainerChildren = undefined
        if (childrenTarget == "children")
            contentAreaItemContainerChildren = contentAraeItemContent
        else
            contentAreaItemContainerProps[childrenTarget] = contentAraeItemContent

        const ContentAreaItemContainer = contentItemElement || "div"

        return <ContentAreaItemContainer key={ contentAreaItemContainerKey } {...contentAreaItemContainerProps}>{ contentAreaItemContainerChildren }</ContentAreaItemContainer>
    })

    // Build container element
    const contentAreaContainerProps : any = {
        className: `opti-content-area ${ Array.isArray(className) ? className.join(' ') : ( className ?? '')}`.trim(),
        "data-epi-edit": inEditMode && fieldName ? fieldName : undefined,
        ...additionalProps
    }
    const contentAreaContainerChildrenTarget = itemsProperty ?? "children"
    let contentAreaContainerChildren = undefined
    if (contentAreaContainerChildrenTarget == "children")
        contentAreaContainerChildren = componentData
    else
        contentAreaContainerProps[contentAreaContainerChildrenTarget] = componentData
    const ContentAreaContainer = elementType ?? "div"
    return <ContentAreaContainer { ...contentAreaContainerProps }>{ contentAreaContainerChildren }</ContentAreaContainer>
}

function forValidContentAreaItems(itm?: ContentAreaItemDefinition | null) : itm is ValidContentAreaItemDefinition
{
    return typeof(itm) == 'object' && itm != null && typeof (itm._metadata) == 'object' && itm._metadata != null
}

/**
 * 
 * @param items 
 * @param locale 
 * @returns 
 */
/*export function processContentAreaItems( items?: (ContentAreaItemDefinition | null)[] | null, locale?: string) : JSX.Element[]
{
    const actualItems = (items ?? []).filter(Utils.isNotNullOrUndefined)
    return actualItems.map((item, idx) => {
        // Prepare data from received content area format
        const contentLink = normalizeContentLinkWithLocale({ ...item.item, locale: locale })
        if (!contentLink)
            throw new Errors.InvalidContentLinkError({ ...item.item, locale: locale })
        const contentType = Utils.normalizeContentType(item.item?.data?.contentType)
        const fragmentData = item.item?.data || undefined
        const guidValue = (item.item?.guidValue ?? "00000000-0000-0000-0000-000000000000")+"::"+idx

        // Build output
        const content : JSX.Element = <CmsContent contentLink={ contentLink } contentType={ contentType } fragmentData={ fragmentData } key={ guidValue } />
        return content
    })
}*/

export default CmsContentArea