import { PropsWithChildren, type ReactNode, type ElementType as ReactElementType } from 'react'
import { GenericContext, PropsWithContext } from '../../context/types.js'
import type {
  ElementType,
  GenericContextProps,
  ElementProps,
} from '../type-utils.js'
import { type ContentLink } from '@remkoj/optimizely-graph-client'

/**
 * Properties for `CmsEditable`.
 *
 * `CmsEditable` wraps output with Optimizely edit markers so fields and blocks can be
 * selected in edit mode.
 *
 * Quick start:
 * - Provide `cmsId` for block/content identification.
 * - Provide `cmsFieldName` when you want field-level editing.
 * - Choose wrapper element with `as` (defaults to `div`).
 *
 * @example
 * ```tsx
 * <CmsEditable as="section" cmsId={content._metadata.key} cmsFieldName="MainBody">
 *   <p>{content.MainBody}</p>
 * </CmsEditable>
 * ```
 *
 * @example
 * ```tsx
 * <CmsEditable
 *   as="h2"
 *   cmsId={content._metadata.key}
 *   cmsFieldName="Heading"
 *   editType="inline"
 * >
 *   {content.Heading}
 * </CmsEditable>
 * ```
 */
export type CmsEditableProps<FT extends ElementType> = PropsWithChildren<
  {
    /**
     * Wrapper element or component used for rendering.
     *
     * Defaults to `div`.
     * Accepts intrinsic elements (for example `"span"`, `"section"`) or custom
     * React components.
     */
    as?: FT

    /**
     * Identifier of the rendered CMS content item.
     *
     * When edit attributes are active, this is written to `data-epi-block-id` and/or
     * `data-epi-content-id`.
     *
     * Recommended value: content key from your model metadata.
     */
    cmsId?: string | null

    /**
     * Field name to mark as editable (for example `"Heading"`, `"MainBody"`).
     *
     * In edit mode this enables field-level highlighting/editing metadata.
     */
    cmsFieldName?: string | null

    /**
     * Optional CMS context override.
     *
     * Use this when you need to provide context explicitly; otherwise context is resolved
     * by the caller/wrapper.
     */
    ctx?: GenericContext

    /**
     * Forward `ctx` to the custom `as` component.
     *
      * - `true` (default): forward as prop name `ctx`.
      * - `false`: do not forward context.
     * - `"propName"`: forward using custom prop name.
     *
     * Ignored for intrinsic HTML elements.
      *
      * If the component passed through `as` is on the opposite rendering side,
      * set this to `false` to prevent boundary issues:
      * - `CmsEditable` on client + `as` server component -> use `forwardCtx={false}`
      * - `CmsEditable` on server + `as` client component -> use `forwardCtx={false}`
     */
    forwardCtx?: boolean | GenericContextProps<FT>

    /**
     * Force adding `data-epi-block-id` when `cmsId` is present.
     *
     * Useful when you need block-level markers even if the default filtering logic would
     * otherwise suppress them.
     */
    forceBlockId?: boolean

    /**
     * Content identity check used to conditionally output field-level edit markers.
     *
     * When provided, field attributes are added only if
     * `currentContent.key === editableContent.key`.
     * This condition affects field-level markers, not `cmsId` output.
     */
    currentContent?: ContentLink
  } & Omit<
    ElementProps<FT>,
    | 'as'
    | 'cmsId'
    | 'cmsFieldName'
    | 'ctx'
    | 'forwardCtx'
    | 'forceBlockId'
    | 'currentContent'
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
  forceBlockId = false,
  currentContent,
  ...props
}: PropsWithContext<CmsEditableProps<CT>>) => {
  // Narrow render target to avoid TS2590 from expanding CT over a huge union at JSX spread sites
  const RenderElement = (as || 'div') as ReactElementType

  const {
    inEditMode,
    isDebugOrDevelopment,
    isDebug,
    editableContent
  } = ctx || {
    inEditMode: false,
    isDebug: true,
    isDebugOrDevelopment: true,
    editableContentIsExperience: false,
  }
  const addEditProps = inEditMode
    ? currentContent
      ? editableContent?.key === currentContent.key
      : true
    : false

  if (!addEditProps) {
    // console.log('⚠ [CmsEditable] Not adding edit props, either not in edit mode or currentContent does not match editableContent', props)
    return children ? <RenderElement {...props}>{children}</RenderElement> : <RenderElement {...props} />
  }

  if (isDebugOrDevelopment && inEditMode && !cmsFieldName && !cmsId) {
    console.warn(
      `⚠ [CmsEditable] CMS Editable used without a fieldname or id, this will not ouline the item`
    )
    if (isDebug) {
      console.trace('This happened here')
    }
  }

  // If we're rendering for an experience, we don't need to inject property names, as the
  // experience editor only deals with property ids - injecting property names will cause
  // it to outline incorrect items.
  const propertyName = cmsFieldName ?? undefined

  const showBlockId = forceBlockId || (cmsId && editableContent?.key ?
    editableContent.key !== cmsId :
    true);
  const showContentId = forceBlockId || (cmsId?.length == 32 && (cmsId && editableContent?.key ?
    editableContent.key !== cmsId :
    true));

  const itemProps: Record<string, unknown> = addEditProps
    ? {
      ...props,
      // We assume GUIDs are represented as 32 char long strings, all other values are IDs
      'data-epi-block-id': showBlockId ? cmsId : undefined,
      // We assume GUIDs are represented as 32 char long strings
      'data-epi-content-id': showContentId ? cmsId : undefined,
      // We pass through the property name if provided
      'data-epi-edit': propertyName,
      // We pass through the property name if provided
      // 'data-epi-property-name': editType ? dataEpiPropertyName : undefined,
      // We pass through the property name if provided
      // 'data-epi-edit': editType ? undefined : dataEpiPropertyName,
      // Configure the rendition of the property editor
      // 'data-epi-property-edittype': editType ?? undefined,
    }
    : {
      ...props,
    }

  if (typeof RenderElement !== 'string') {
    console.log(`⚠ [CmsEditable] Rendering a custom component, forwarding context to ${RenderElement.name}`, forwardCtx);
    if (forwardCtx === true) itemProps['ctx'] = ctx
    if (typeof forwardCtx === 'string' && forwardCtx.length > 0)
      itemProps[forwardCtx] = ctx
  }

  return <RenderElement {...itemProps}>{children}</RenderElement>
}

export default CmsEditable
