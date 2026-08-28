import { type ComponentType } from 'react'
import { type CmsContentComponent, type PropsWithCmsContent } from './types.js'

export function withCmsContent<P>(
  component: ComponentType<PropsWithCmsContent<P>>,
  cmsContentComponent: CmsContentComponent
): ComponentType<P> {
  const BaseComponent = component
  return (props: P) => (
    <BaseComponent cmsContent={cmsContentComponent} {...props} />
  )
}
