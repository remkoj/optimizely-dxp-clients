'use client'

import { useState, useEffect, type FunctionComponent, type PropsWithChildren } from 'react'
import { useRouter } from 'next/navigation'

export type OnPageEditProps = PropsWithChildren<{
    mode?: 'edit' | 'preview'
    className?: string
    timeout?: number
}>

export type OptimizelyCmsContext = {
    ready: boolean
    inEditMode: boolean
    isEditable: boolean
    subscribe: (event: string, handler: (...args: any) => void) => void
}

export type OptimizelyCmsContentSavedEvent = {
    contentLink: string,
    editUrl: string,
    previewUrl: string
}

declare global {
    interface Window { 
        epi?: OptimizelyCmsContext
    }
}

export const OnPageEdit : FunctionComponent<OnPageEditProps> = ({ mode, children, className, timeout }) => 
{
    const router = useRouter()
    const [ optiCmsReady, setOptiCmsReady ] = useState<boolean>(false)
    const [ showMask, setShowMask ] = useState<boolean>(false)
    timeout = timeout ?? 1500

    // Bind to the CMS & CMS Ready State
    useEffect(() => {
        console.log("Reading Opti CMS Context")
        const fxCms = tryGetCms()
        const cmsReady = fxCms?.ready ?? false
        setOptiCmsReady(cmsReady)
        if (!cmsReady) {
            const cancelToken = setInterval(() => {
                const updateCms = tryGetCms()
                const updatedCmsReady = updateCms?.ready ?? false
                if (updatedCmsReady) {
                    clearInterval(cancelToken)
                    setOptiCmsReady(updatedCmsReady)
                }
            }, 250)
            return () => {
                clearInterval(cancelToken)
            }
        }
    }, [])

    // Bind to the Saved event
    useEffect(() => {
        if (!optiCmsReady)
            return

        const previewUrl = window.location.href
        let handlerEnabled = true

        // Define event handler
        let maskTimer : NodeJS.Timeout  | false = false
        function onContentSaved(eventData: OptimizelyCmsContentSavedEvent)
        {
            // If the effect has been undone, disable this handler
            if (!handlerEnabled) return

            setShowMask(true)
            if (maskTimer != false)
                clearTimeout(maskTimer)
            
            console.log(`Delaying refresh with ${ timeout }ms to allow Optimizely Graph to update`, eventData)
            maskTimer = setTimeout(() => {
                const contentId = window.location.pathname.split(',,')[1]
                const newContentId = eventData?.contentLink as string | undefined

                // First: Use the updated preview URL if we have it
                if (eventData?.previewUrl && previewUrl != eventData.previewUrl) {
                    const newUrl = new URL(eventData.previewUrl)
                    console.log(`Navigating to provided preview path: ${ newUrl.pathname }${ newUrl.search }`)
                    router.push(newUrl.pathname + newUrl.search)

                // Second: Use the provided Content ID to navigate to the new URL 
                } else if (newContentId && contentId != newContentId) {
                    const newUrl = new URL(window.location.href)
                    const pathParts = newUrl.pathname.split(',,')
                    pathParts[1] = newContentId
                    newUrl.pathname = pathParts.join(',,')
                    console.log(`Navigating to newly constructed URL to reflect ContentID change: ${ newUrl.href }`)
                    router.push(newUrl.pathname + newUrl.search)

                // Third: Refresh the page
                } else {
                    console.log(`Refreshing preview: ${ contentId }`)
                    router.refresh()
                }
                setShowMask(false)
            }, timeout)
        }

        // Subscribe to event
        console.log(`Subscribing to ContentSaved Event`)
        const opti = tryGetCms()
        opti?.subscribe('contentSaved', onContentSaved)

        // Unsubscribe when needed
        return () => {
            console.log(`Navigating away, disabling ContentSaved event handler`)
            if (maskTimer != false)
                clearTimeout(maskTimer)
            handlerEnabled = false
        }
    }, [ optiCmsReady, router, timeout ])

    return showMask ? children : null
}

function tryGetCms() : OptimizelyCmsContext | undefined
{
    try {
        return window.epi
    } catch {
        return undefined
    }
}

export default OnPageEdit