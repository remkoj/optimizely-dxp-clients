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

  // Optimizely Graph stores the type in Most Significant first order, we need least significant first, also we're stripping out the common "Content" item from it
  const myContentType = prefix
    ? Utils.normalizeAndPrefixContentType(
        Array.isArray(contentType) ? [...contentType].reverse() : contentType,
        prefix
      )
    : Utils.normalizeContentType(
        Array.isArray(contentType) ? [...contentType].reverse() : contentType,
        true
      )

  // Validate that we have a value to ask the factory a component for
  if (!myContentType || myContentType.length == 0) {
    if (isDebug)
      console.error(
        `🔴 [CmsContent][resolveComponent] The content type ${JSON.stringify(contentType)}, with prefix ${JSON.stringify(prefix)} yielded an empty normalized type`
      )
    throw new Error(
      `The content type ${JSON.stringify(contentType)}, with prefix ${JSON.stringify(prefix)} yielded an empty normalized type`
    )
  }

  /*if (isDebug)
    console.log(
      `⚪ [CmsContent][resolveComponent] Normalized content type ${JSON.stringify(contentType)} to ${myContentType}`
    )*/

  // Resolve component
  const Component = Utils.resolveComponentType(
    factory,
    myContentType,
    variant ? [variant] : []
  ) as EnhancedCmsComponent | undefined

  // Handle component not found in factory
  if (!Component) {
    const contentTypeDisplay = Array.isArray(myContentType)
      ? myContentType.join('/')
      : myContentType
    if (isDebug)
      console.warn(
        `🟠 [CmsContent] Component of type "${contentTypeDisplay}" not resolved by factory`
      )
    if (isDebug || inEditMode) {
      const ErrorComponent: ComponentMissingComponent = ({
        children,
        contentLink,
      }) => (
        <>
          <div className="opti-error">
            Component of type "{contentTypeDisplay}" not resolved by factory for{' '}
            {contentLink?.key ?? ''} version {contentLink?.version ?? ''}
          </div>
          {children}
        </>
      )
      ErrorComponent.displayName = 'Opti::ComponentMissing'
      return ErrorComponent
    }
    const ErrorComponent: ComponentMissingComponent = (props) => props.children
    ErrorComponent.displayName = 'Opti::ComponentMissing'
    return ErrorComponent
  }

  // Return the component
  /*if (isDebug)
    console.log(
      '⚪ [CmsContent] Rendering item using component:',
      getComponentLabel(Component as ComponentType)
    )*/
  return Component
}

export default resolveComponent

export type ComponentMissingComponent = FunctionComponent<
  PropsWithChildren<{ contentLink?: ContentLink }>
> & {
  displayName: 'Opti::ComponentMissing'
}

export function isComponentMissingComponent(
  toTest: ComponentType<any> | null | undefined
): toTest is ComponentMissingComponent {
  return toTest?.displayName == 'Opti::ComponentMissing'
}
