

export type OptimizelyOneGadgetProps = {
    /**
     * The API Route at which the companion API has been installed in your
     * Next.JS Application.
     * 
     * If not set, defaults to "/api/me"
     */
    servicePrefix?: string

    /**
     * The interval, in milliseconds, between refreshes of the content in the
     * debug panels.
     * 
     * If not set, defaults to 0 (no auto refresh)
     */
    refreshInterval?: number

    /**
     * If set, bypasses the enabled/disabled detection allowing the application
     * to take control of the visibility of the gadget.
     */
    show?: boolean

    showDataPlatform?: boolean
    showContentRecs?: boolean
    showWebEx?: boolean
}
