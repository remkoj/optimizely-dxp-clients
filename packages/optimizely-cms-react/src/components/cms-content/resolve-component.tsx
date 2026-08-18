import { type ComponentTypeHandle } from '../../factory/types.js'
import { type EnhancedCmsComponent } from './types.js'
import * as Utils from '../../utilities.js'
import { type GenericContext } from '../../context/types.js'
import {
  type FunctionComponent,
  type PropsWithChildren,
  type ComponentType,
} from 'react'
import { type ContentLink } from '@remkoj/optimizely-graph-client'

export function getComponentLabel(componentInstance?: ComponentType | null) {
  if (!componentInstance) return 'n/a'
  if (componentInstance.displayName) return componentInstance.displayName
  if (typeof componentInstance == 'function' && componentInstance.name)
    return componentInstance.name
  return componentInstance.toString()
}

/**
 * Helper function to safely resolve a component from the ContentType information to
 *
 * @param   contentType     The content type to get the component for
 * @param   prefix          The prefix/context of the component (typically "component", "element", etc..)
 * @param   ctx             The context in which to operate
 * @returns The component required for rendering
 */
export function resolveComponent(
  contentType: ComponentTypeHandle | null | undefined,
  prefix: string | null | undefined,
  variant: string | null | undefined,
  ctx: GenericContext
) {
  const { factory, isDebug, inEditMode } = ctx

  // Ensure we have a factory - we should, but lets' help by providing an explicit error
  if (!factory) {
    console.error(
      `🔴 [CmsContent][resolveComponent] No content type factory registered in the context`
    )
    throw new Error('Empty factory on the context')
  }

  // Make sure that we normalize the input from graph into a string array
  const myContentType = Utils.normalizeContentType(contentType, false);

  // Validate that we have a value to ask the factory a component for, if not,
  // return a component that will just render its' children and log a warning to
  // the console.
  if (!myContentType || myContentType.length == 0) {
    const errorMessage = contentType ?
      `The content type ${JSON.stringify(contentType)} yielded an empty normalized type` :
      'Unable to resolve a component for an empty content type';
    return createErrorComponent(errorMessage, false, 'EmptyContentType');
  }
  
  // Resolve component if - and only if - the type is set
  const Component = Utils.resolveComponentType(
    factory,
    myContentType,
    [variant, prefix].filter(Utils.isNotNullOrUndefined)
  ) as EnhancedCmsComponent | undefined

  // Handle component not found in factory
  if (!Component) {
    const contentTypeDisplay = Array.isArray(myContentType)
      ? myContentType.filter(Utils.isNonEmptyString).join('/')
      : (myContentType as string | undefined)

    // Build the error message
    const errorMessage = `Component of type "${contentTypeDisplay}" not found in factory`;

    // Return the error component, which will render the children and log a warning to
    // the console.
    return createErrorComponent(errorMessage, isDebug || inEditMode, 'ComponentNotFound');
  }

  return Component
}

export default resolveComponent

/**
 * Create a component that will render its' children and log a warning to the console
 * about the missing component. When `showMessage` is true, it will also render the 
 * message in the UI.
 * 
 * @param message     The message to display in the console and optionally in the UI
 * @param showMessage Whether to show the message in the UI or not
 * @param reason      The reason for the missing component, either "EmptyContentType" 
 *                    or "ComponentNotFound"
 * @returns           The error component that will render its' children and optionally
 *                    the error message
 */
const createErrorComponent = (
  message: string,
  showMessage?: boolean,
  reason: ComponentMissingComponent['reason'] = 'ComponentNotFound'
): ComponentMissingComponent => {
  const ErrorComponent: ComponentMissingComponent = ({ children, contentLink }) => {
    console.warn(`🟠 [CmsContent][resolveComponent] ${ reason }: ${ message } for content item ${ JSON.stringify(contentLink) }`);
    return showMessage && message ? (
      <>
        <div className="opti-error">{ message } for content item { contentLink?.key || 'undefined' }, version { contentLink?.version || 'published or primary draft' }</div>
        {children}
      </>
    ) : children;
  }
  ErrorComponent.displayName = 'Opti::ComponentMissing';
  ErrorComponent.reason = reason;
  return ErrorComponent;
}

export type ComponentMissingComponent = FunctionComponent<
  PropsWithChildren<{ contentLink?: ContentLink }>
> & {
  displayName: 'Opti::ComponentMissing'
  reason: "EmptyContentType" | "ComponentNotFound"
}

export function isComponentMissingComponent(
  toTest: unknown
): toTest is ComponentMissingComponent {
  return (toTest as ComponentMissingComponent | undefined)?.displayName === 'Opti::ComponentMissing'
}