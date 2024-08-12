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
        console.log(`🟢 Enabling ContentSaved event handler`)
        window.addEventListener("optimizely:cms:contentSaved", listener);

        let unsub : (() => void) | undefined = undefined
        let cancelled : boolean = false

        waitFor(() => window.epi).then(epi => {
            if (!cancelled) {
                console.log(`⚪ Enabling ContentSaved event handler`)
                let r = epi.subscribe('contentSaved', onContentSaved )
                unsub = r.remove
            }
        }).catch(() => {
            console.warn("Unable to bind to the contentSaved event")
        })

        // Unsubscribe when needed
        return () => {
            cancelled = true
            console.log(`Navigating away, disabling ContentSaved event handler`)
            window.removeEventListener("optimizely:cms:contentSaved", listener)
            if (unsub)
                unsub()
        }
    }, [router])

    return showMask ? children : null
}

export default OnPageEdit


function waitFor<T>(fn: () => T | undefined, timeOutSeconds: number = 10, intervalMs: number = 250) : Promise<T>
{
    return new Promise<T>((resolve, reject) => {
        const iv = setInterval(() => {
            try {
                const cv = fn()
                if (cv != undefined) {
                    clearInterval(iv)
                    clearTimeout(wt)
                    resolve(cv)
                }
            } catch {
                //Ignore errors
            }
        }, intervalMs)
        const wt = setTimeout(() => {
            clearInterval(iv)
            reject(`The function has not yielded a value within ${ timeOutSeconds } seconds`)
        }, timeOutSeconds * 1000)
    })
}

declare global {
    interface Window { epi?: {
        subscribe: (eventName: string, handler: (data: OptimizelyCmsContentSavedEvent) => void) => {
            remove: () => void
        }
    }; }
}