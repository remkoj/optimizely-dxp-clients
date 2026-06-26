'use client'
import {
  useEffect,
  useLayoutEffect,
  type FunctionComponent,
  type PropsWithChildren,
} from 'react'
import { usePathname } from 'next/navigation'
import { useOptimizelyOne } from './context'

export type PageActivatorProps = PropsWithChildren

export const PageActivator: FunctionComponent<PageActivatorProps> = (props) => {
  const path = usePathname()
  const opti = useOptimizelyOne()

  // Page activation effect
  useLayoutEffect(() => {
    if (opti.debug)
      console.groupCollapsed(
        `📑 [Optimizely One] Applying layout effects for: ${path}`
      )

    opti
      .getActivatePageServices()
      .forEach((service) => service.activatePage(path))

    if (opti.debug) console.groupEnd()
  }, [path, opti])

  // Page tracking effect
  useEffect(() => {
    if (opti.disableAutotracking) {
      if (opti.debug)
        console.log('🔐 [Optimizely One] Automatic page tracking and profile data updates disabled')
      return
    }

    if (opti.debug)
      console.groupCollapsed(
        `📢 [Optimizely One] Path update detected, tracking page view and updating profile data for: ${path}`
      )
    const abort = new AbortController()
    opti.getTrackPageServices().forEach((service) => service.trackPage(path));
    opti.discoverProfileData(abort.signal);
    if (opti.debug) console.groupEnd();
    return () => abort.abort(`[Optimizely One] Page tracking cancelled for: ${path}`);
  }, [path, opti])

  return <>{props.children}</>
}
PageActivator.displayName = 'Optimizely One: (Layout) Effect processor'
export default PageActivator
