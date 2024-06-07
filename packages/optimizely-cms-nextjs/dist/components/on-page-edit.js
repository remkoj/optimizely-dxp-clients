'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation.js';
export const OnPageEdit = ({ mode, children, className }) => {
    const router = useRouter();
    const [optiCmsReady, setOptiCmsReady] = useState(false);
    const [showMask, setShowMask] = useState(false);
    // Bind to the CMS & CMS Ready State
    useEffect(() => {
        console.log("Reading Opti CMS Context");
        const fxCms = tryGetCms();
        const cmsReady = fxCms?.ready ?? false;
        setOptiCmsReady(cmsReady);
        if (!cmsReady) {
            const cancelToken = setInterval(() => {
                const updateCms = tryGetCms();
                const updatedCmsReady = updateCms?.ready ?? false;
                if (updatedCmsReady) {
                    clearInterval(cancelToken);
                    setOptiCmsReady(updatedCmsReady);
                }
            }, 250);
            return () => {
                clearInterval(cancelToken);
            };
        }
    }, []);
    // Bind to the Saved event
    useEffect(() => {
        if (!optiCmsReady)
            return;
        const previewUrl = window.location.href;
        // Define event handler
        function onContentSaved(eventData) {
            setShowMask(true);
            // First: Use the updated preview URL if we have it
            if (eventData?.previewUrl && previewUrl != eventData.previewUrl) {
                const newUrl = new URL(eventData.previewUrl);
                console.log(`Navigating to provided preview path: ${newUrl.pathname}${newUrl.search}`);
                router.push(newUrl.pathname + newUrl.search);
                // Third: Refresh the page
            }
            else {
                console.log(`Refreshing preview: ${eventData.contentLink}`);
                router.refresh();
            }
            setShowMask(false);
        }
        // Subscribe to event
        console.log(`Subscribing to ContentSaved Event`);
        const opti = tryGetCms();
        const disposer = opti?.subscribe('contentSaved', onContentSaved);
        // Unsubscribe when needed
        return () => {
            console.log(`Navigating away, disabling ContentSaved event handler`);
            disposer?.remove();
        };
    }, [optiCmsReady, router]);
    return showMask ? children : null;
};
function tryGetCms() {
    try {
        return window.epi;
    }
    catch {
        return undefined;
    }
}
export default OnPageEdit;
//# sourceMappingURL=on-page-edit.js.map