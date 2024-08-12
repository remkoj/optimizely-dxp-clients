'use client'
import { useEffect, useLayoutEffect, type FunctionComponent, type PropsWithChildren } from 'react'
import { usePathname } from 'next/navigation'
import { useOptimizelyOne } from './context'
import { type OptimizelyOneProfileData } from '@/client-types'

export type PageActivatorProps = PropsWithChildren<{}>

export const PageActivator : FunctionComponent<PageActivatorProps> = props => 
{
    const path = usePathname()
    const opti = useOptimizelyOne()

    // Page activation effect
    useLayoutEffect(() => {
        if (opti.debug) console.groupCollapsed(`📑 [Optimizely One] Applying layout effects for: ${ path }`)
        
        opti.getActivatePageServices().forEach(service => service.activatePage(path))

        if (opti.debug)
            console.groupEnd()
    }, [path, opti])

    // Page tracking effect
    useEffect(() => {
        if (opti.disableAutotracking) {
            if (opti.debug) console.log('🔐 [Optimizely One] Automatic page tracking disabled')
            return
        }

        if (opti.debug) console.groupCollapsed(`📢 [Optimizely One] Tracking page view for: ${ path }`)
        opti.getTrackPageServices().forEach(service => service.trackPage(path))
        if (opti.debug) console.groupEnd()

        
    }, [ path, opti ])

    // Profile data effect
    useEffect(() => {
        if (opti.debug) console.log(`📢 [Optimizely One] Refreshing profile data for: ${ path }`)
        const abort = new AbortController()
        Promise.allSettled(opti.getProfileDataSources().map(pds => pds.discoverProfileData(abort.signal))).then(results => {
            const mergedProfileData : OptimizelyOneProfileData = { custom: {} }
            results.forEach(result => {
                if (result.status == "fulfilled") {
                    if (result.value.content_intelligence_id)
                        mergedProfileData.content_intelligence_id = result.value.content_intelligence_id
                    mergedProfileData.custom = { ...mergedProfileData.custom, ...result.value.custom }
                }
            })
            if (mergedProfileData.content_intelligence_id || Object.getOwnPropertyNames(mergedProfileData.custom).length > 0) {
                if (opti.debug) console.log(`📢 [Optimizely One] Discovered profile data: ${ JSON.stringify( mergedProfileData )}`)
                opti.getProfileServices().forEach(service => service.updateProfile(mergedProfileData))
            }
        })
        return () => {
            abort.abort(`[Optimizely One] Profile data refresh cancelled`)
        }
    }, [ path, opti ])

    return <>{ props.children }</>
}
PageActivator.displayName = "Optimizely One: (Layout) Effect processor"
export default PageActivator