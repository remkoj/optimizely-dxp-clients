'use client'

import { useState, useEffect, type FunctionComponent, type PropsWithChildren } from 'react'
import { useRouter } from 'next/navigation.js'

type OptimizelyCmsContentSavedEvent = {
    contentLink: string,
    editUrl: string,
    previewUrl: string,
    previewToken: string
}

export const OnPageEdit: FunctionComponent<PropsWithChildren> = ({ children }) => {
    const router = useRouter()
    const [showMask, setShowMask] = useState<boolean>(false)

    function onContentSaved(eventData: OptimizelyCmsContentSavedEvent) {
        const previewUrl = window.location.href

        setShowMask(true)

        // First: Use the updated preview URL if we have it
        if (eventData?.previewUrl && previewUrl != eventData.previewUrl) {
            const newUrl = new URL(eventData.previewUrl)
            console.log(`Navigating to provided preview path: ${newUrl.pathname}${newUrl.search}`)
            router.push(newUrl.pathname + newUrl.search)
            // or refresh the page
        } else {
            console.log(`Refreshing preview: ${eventData.contentLink}`)
            router.refresh()
        }
        setShowMask(false)
    }

    const listener = (event: any) => onContentSaved(event.detail);

    // Bind to the Saved event
    useEffect(() => {
        window.addEventListener("optimizely:cms:contentSaved", listener);

        // Unsubscribe when needed
        return () => {
            console.log(`Navigating away, disabling ContentSaved event handler`)
            window.removeEventListener("optimizely:cms:contentSaved", listener)
        }
    }, [router])

    return showMask ? children : null
}

export default OnPageEdit
