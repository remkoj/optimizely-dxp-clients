import { type ComponentProps, type ComponentType as ReactComponentType, type ExoticComponent as ReactExoticComponent, type ReactNode } from 'react'
import { PropsWithContext } from '../../context/types.js';

export type EditableComponentType = (ReactComponentType<any>) | (ReactExoticComponent<any>) | (keyof JSX.IntrinsicElements);
export type EditableComponentProps<FT extends EditableComponentType> = FT extends keyof JSX.IntrinsicElements ? JSX.IntrinsicElements[FT] : ComponentProps<FT>
export type CmsEditableProps<FT extends EditableComponentType> = {
    as?: FT
} & ({
    cmsId?: string | null
    cmsFieldName?: never
} | {
    cmsId?: never
    cmsFieldName?: string | null
}) & EditableComponentProps<FT>
export type CmsEditableComponent = <CT extends EditableComponentType>(props: CmsEditableProps<CT>) => ReactNode
export type CmsEditableBaseComponent = <CT extends EditableComponentType>(props: PropsWithContext<CmsEditableProps<CT>>) => ReactNode

/**
 * Server side wrapper to create HTML elements that include the needed 
 * data-epi- properties to render the edit mode markers
 * 
 * @param   param0      The HTML element with the simple properties
 * @returns 
 */
//@ts-expect-error Typescript doesn't understand the property type :'(
export const CmsEditable : CmsEditableBaseComponent = <CT extends EditableComponentType = 'div'>({ ctx, as: DefaultElement = 'div', cmsId, cmsFieldName, children, key, ...props }: PropsWithContext<CmsEditableProps<CT>>) =>
{
    const { inEditMode } = ctx
    return <DefaultElement {...props} data-epi-block-id={ inEditMode ? cmsId ?? undefined : undefined } data-epi-property-name={ inEditMode ? cmsFieldName ?? undefined : undefined }>{ children }</DefaultElement>
}

export default CmsEditable