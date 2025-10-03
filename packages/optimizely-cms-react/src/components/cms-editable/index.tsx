import { PropsWithChildren, type ReactNode } from 'react'
import { GenericContext, PropsWithContext } from '../../context/types.js'
import type {
  ElementType,
  GenericContextProps,
  ElementProps,
} from '../type-utils.js'
import { type ContentLink } from '@remkoj/optimizely-graph-client'

export type CmsEditableProps<FT extends ElementType> = PropsWithChildren<
  {
    /**
     * Override the component used to render, instead of wrapping the children. It allows
     * any valid JSX identifier (e.g. HTML Element, Component or ExoticComponent)
     */
    as?: FT

    /**
     * The identifier of the component wrapped in this CmsEditable component. This will
     * add the 'data-epi-block-id' property to the component.
     */
    cmsId?: string | null

    /**
     * The name of the component field wrapped by this CmsEditable component. This will
     * add the 'data-epi-property-name' property to the component.
     */
    cmsFieldName?: string | null

    /**
     * The Context to be used when determining if the page rendering happens in edit mode
     * or not.
     */
    ctx?: GenericContext

    /**
     * The default CTX paramteer is caught by this component, set this to true to pass the
     * `ctx` property to the 'as' Component, or set to a valid property name to pass into
     * that property.
     */
    forwardCtx?: boolean | GenericContextProps<FT>

    /**
     * If set, the `data-epi-block-id` attribute will always be included when the `cmsId`
     * parameter is being set.
     */
    forceBlockId?: boolean

    /**
     * If set `CmsEditable` will output both `cmsId` and `cmsFieldName` (if both are provided)
     * otherwise it will prioritize `cmsFieldName`.
     */
    forceId?: boolean

    /**
     * If set, this will be used to test if the content item being rendered is actually
     * the one being edited. This allows conditional output of the edit properties. This will
     * only affect `cmsFieldName`, not `cmsId`.
     */
    currentContent?: ContentLink

    /**
     * Override the value for the `data-epi-property-edittype` property
     */
    editType?: 'floating' | 'inline' | null
  } & Omit<
    ElementProps<FT>,
    | 'as'
    | 'cmsId'
    | 'cmsFieldName'
    | 'ctx'
    | 'forwardCtx'
    | 'forceBlockId'
    | 'forceId'
    | 'currentContent'
    | 'editType'
  >
>

export type CmsEditableComponent = <CT extends ElementType>(
  props: CmsEditableProps<CT>
) => ReactNode
export type CmsEditableBaseComponent = <CT extends ElementType>(
  props: PropsWithContext<CmsEditableProps<CT>>
) => ReactNode

/**
 * Server side wrapper to create HTML elements that include the needed
 * data-epi- properties to render the edit mode markers. If the `cmsId`
 * is a 32 character long string, it is assumed to be a GUID and rendered
 * as `data-epi-content-id`, otherwise it is rendered as `data-epi-block-id`.
 *
 * @param   param0      The HTML element with the simple properties
 * @returns
 */
export const CmsEditable: CmsEditableBaseComponent = <CT extends ElementType>({
  ctx,
  forwardCtx = false,
  as,
  cmsId = null,
  cmsFieldName = null,
  children,
  key,
  forceBlockId = false,
  forceId = true,
  currentContent,
  editType = null,
  ...props
}: PropsWithContext<CmsEditableProps<CT>>) => {
  const {
    inEditMode,
    isDebugOrDevelopment,
    isDebug,
    editableContent,
    editableContentIsExperience,
  } = ctx || {
    inEditMode: false,
    isDebug: true,
    isDebugOrDevelopment: true,
    editableContentIsExperience: false,
  }
  const DefaultElement = as || 'div'

  if (isDebugOrDevelopment && inEditMode && !cmsFieldName && !cmsId) {
    console.warn(
      `⚠ [CmsEditable] CMS Editable used without a fieldname or id, this will not ouline the item`
    )
    if (isDebug) {
      console.trace('This happened here')
    }
  }

  const addEditProps = inEditMode
    ? currentContent
      ? editableContent?.key == currentContent.key
      : true
    : false

  // If we're rendering for an experience, we don't need to inject property names, as the
  // experience editor only deals with property ids - injecting property names will cause
  // it to outline incorrect items.
  const dataEpiPropertyName = editableContentIsExperience
    ? undefined
    : (cmsFieldName ?? undefined)

  const showBlockId =
    cmsId && cmsId?.length != 32 && (forceBlockId || !dataEpiPropertyName)
  const showContentId =
    cmsId?.length == 32 && (forceBlockId || !dataEpiPropertyName)

  const itemProps: Record<string, any> = addEditProps
    ? {
        ...props,
        // We assume GUIDs are represented as 32 char long strings, all other values are IDs
        'data-epi-block-id': showBlockId ? cmsId : undefined,
        // We assume GUIDs are represented as 32 char long strings
        'data-epi-content-id': showContentId ? cmsId : undefined,
        // We pass through the property name if provided
        'data-epi-property-name': dataEpiPropertyName,
        // We pass through the property name if provided
        'data-epi-edit': dataEpiPropertyName,
        // Configure the rendition of the property editor
        'data-epi-property-edittype': editType ?? undefined,
      }
    : {
        ...props,
      }

  if (typeof DefaultElement !== 'string') {
    if (forwardCtx === true) itemProps['ctx'] = ctx
    if (typeof forwardCtx === 'string' && forwardCtx.length > 0)
      itemProps[forwardCtx] = ctx
  }

  return <DefaultElement {...itemProps}>{children}</DefaultElement>
}

export default CmsEditable
