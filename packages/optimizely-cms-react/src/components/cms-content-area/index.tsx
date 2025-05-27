import type { ElementType } from '../type-utils.js'
import * as Utils from '../../utilities.js'
import * as Errors from '../../errors.js'
import {
  normalizeContentLinkWithLocale,
  contentLinkToString,
} from '@remkoj/optimizely-graph-client/utils'
import type {
  CmsContentAreaBaseComponent,
  BaseCmsContentAreaProps,
  ContentAreaItemDefinition,
  ValidContentAreaItemDefinition,
} from './types.js'
import { Suspense, type JSX } from 'react'

//#region Export Type definitions
export type {
  CmsContentAreaClassMapper,
  CmsContentAreaProps,
  ContentAreaItemDefinition,
  CmsContentAreaComponent,
} from './types.js'
//#endregion

/**
 * React server component to render a content area
 *
 * @param       param0      The content area information for rendering
 * @returns
 */
export const CmsContentArea: CmsContentAreaBaseComponent = <
  T extends ElementType = 'div',
  I extends ElementType = 'div',
>({
  items = [] as BaseCmsContentAreaProps<T, I>['items'],
  classMapper,
  fieldName,
  as: elementType,
  itemsProperty,
  itemWrapper,
  useSuspense = false as BaseCmsContentAreaProps<T, I>['useSuspense'],
  fallback,
  noWrapper: noContentAreaContainer = false as BaseCmsContentAreaProps<
    T,
    I
  >['noWrapper'],
  variant,

  ctx,
  cmsContent: CmsContent,

  ...additionalProps
}: BaseCmsContentAreaProps<T, I>) => {
  const { inEditMode = false } = ctx

  // Convert the items to a list of enriched content types and filter out items cannot be loaded
  const componentData = (
    (items || []) as Array<ContentAreaItemDefinition | null | undefined>
  )
    .filter(forValidContentAreaItems)
    .map((item, idx) => {
      // Prepare data from received content area format
      const contentLink = normalizeContentLinkWithLocale(item._metadata)
      if (!contentLink) throw new Errors.InvalidContentLinkError(item._metadata)
      const contentType = Utils.normalizeContentType(item._metadata.types)
      const fragmentData = item

      // Read element wrapper configuration
      const {
        as: ContentAreaItemContainer = 'div',
        itemsProperty: childrenTarget = 'children',
        noWrapper: noContentAreaItemContainer = false,
        className: rawContentAreaItemClassName,
        ...contentItemElementProps
      } = itemWrapper ?? {}
      const contentAreaItemKey = `ContentAreaItem-${idx}-${contentLinkToString(contentLink)}`
      const contentAreaItemClassName = Array.isArray(
        rawContentAreaItemClassName
      )
        ? rawContentAreaItemClassName.join(' ')
        : rawContentAreaItemClassName

      // Output if no wrapper is required
      if (noContentAreaItemContainer)
        return useSuspense ? (
          <Suspense key={contentAreaItemKey} fallback={fallback}>
            <CmsContent
              contentLink={contentLink}
              contentType={contentType}
              fragmentData={fragmentData}
              contentTypePrefix="Component"
              variant={variant}
              ctx={ctx}
            />
          </Suspense>
        ) : (
          <CmsContent
            key={contentAreaItemKey}
            contentLink={contentLink}
            contentType={contentType}
            fragmentData={fragmentData}
            contentTypePrefix="Component"
            variant={variant}
            ctx={ctx}
          />
        )

      // Buld wrapper configuration
      const contentAreaItemContainerProps: any = {
        'data-epi-block-id':
          inEditMode && fieldName
            ? Utils.getContentEditId(contentLink) || undefined
            : undefined,
        'data-displayoption': item.displayOption || undefined,
        'data-tag': item.tag || undefined,
        'data-component': contentType?.at(0),
        ...contentItemElementProps,
        className: `opti-content-area-item opti-content-area-item-${idx}${contentAreaItemClassName ? ' ' + contentAreaItemClassName : ''} ${classMapper ? classMapper(item.displayOption ?? 'default', contentType ?? null, idx) : ''}`,
      }
      const contentAraeItemContent: JSX.Element = useSuspense ? (
        <Suspense fallback={fallback}>
          <CmsContent
            contentLink={contentLink}
            contentType={contentType}
            fragmentData={fragmentData}
            contentTypePrefix="Component"
            variant={variant}
            ctx={ctx}
          />
        </Suspense>
      ) : (
        <CmsContent
          contentLink={contentLink}
          contentType={contentType}
          fragmentData={fragmentData}
          contentTypePrefix="Component"
          variant={variant}
          ctx={ctx}
        />
      )

      // Inject the element into the wrapper
      let contentAreaItemContainerChildren = undefined
      if (childrenTarget == 'children')
        contentAreaItemContainerChildren = contentAraeItemContent
      else
        contentAreaItemContainerProps[childrenTarget] = contentAraeItemContent

      return (
        <ContentAreaItemContainer
          key={contentAreaItemKey}
          {...contentAreaItemContainerProps}
        >
          {contentAreaItemContainerChildren}
        </ContentAreaItemContainer>
      )
    })

  if (noContentAreaContainer) return <>{componentData}</>

  // Build container element
  const contentAreaContainerProps: any = {
    className:
      `opti-content-area ${Array.isArray(additionalProps.className) ? additionalProps.className.join(' ') : (additionalProps.className ?? '')}`.trim(),
    'data-epi-edit': inEditMode && fieldName ? fieldName : undefined,
    'data-component': 'ContentArea',
    ...additionalProps,
  }
  const contentAreaContainerChildrenTarget = itemsProperty ?? 'children'
  let contentAreaContainerChildren = undefined
  if (contentAreaContainerChildrenTarget == 'children')
    contentAreaContainerChildren = componentData
  else
    contentAreaContainerProps[contentAreaContainerChildrenTarget] =
      componentData
  const ContentAreaContainer: ElementType = elementType ?? 'div'
  return (
    <ContentAreaContainer {...contentAreaContainerProps}>
      {contentAreaContainerChildren}
    </ContentAreaContainer>
  )
}

function forValidContentAreaItems(
  itm?: ContentAreaItemDefinition | null
): itm is ValidContentAreaItemDefinition {
  return (
    typeof itm == 'object' &&
    itm != null &&
    typeof itm._metadata == 'object' &&
    itm._metadata != null
  )
}

export default CmsContentArea
