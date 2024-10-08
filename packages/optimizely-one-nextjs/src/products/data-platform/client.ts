'use client'

import * as ClientApi from '../../client-types'

export class DataPlatformService implements ClientApi.OptimizelyOneService<ClientApi.OptimizelyDataPlatformApi>
{
    public order : Readonly<number> = 200
    public code : Readonly<string> = "odp"
    public debug: boolean = false
    public get isActive() : boolean {
        return this.getBrowserApi() != undefined
    }

    public trackPage()
    {
        const zaius = this.getBrowserApi()
        if (!zaius) return
        if (this.debug) console.log("🏬 Data platform - Tracking page view")
        zaius.event('pageview')
        if (this.lastTrackedContentIntelligenceId != this.contentIntelligenceId && this.contentIntelligenceId != '')
        {
            if (this.debug) console.log(`🏬 Data platform - Updating Content Intelligence ID to ${ this.contentIntelligenceId }`)
            zaius.customer({ content_intelligence_id: this.contentIntelligenceId })
            this.lastTrackedContentIntelligenceId = this.contentIntelligenceId
        }
    }

    public trackEvent(event: ClientApi.OptimizelyOneEvent)
    {
        const zaius = this.getBrowserApi()
        if (!zaius) return
        const event_name = event.event
        const event_data : Record<string, any> = {}
        for (const prop_name of (Object.getOwnPropertyNames(event) as (keyof ClientApi.OptimizelyOneEvent)[])) {
            if (prop_name != 'event') event_data[prop_name] = event[prop_name] 
        }
        if (this.debug) console.log("🏬 Data platform - Tracking event:", event_name, event_data)
        zaius.event(event_name, event_data)
    }

    public getBrowserApi()
    {
        try {
            return window.zaius
        } catch {
            return undefined
        }
    }

    public updateProfile(profileData: ClientApi.OptimizelyOneProfileData)
    {
        const zaius = this.getBrowserApi()
        if (!zaius) return
        const ids : Record<string,string> = {}
        if (profileData.content_intelligence_id)
            ids.content_intelligence_id = profileData.content_intelligence_id
        if (this.debug) console.log("🏬 Data platform - Updating profile (ids, attributes):", ids, profileData.custom)
        zaius.customer(ids, profileData.custom)
    }

    private lastTrackedContentIntelligenceId : string | undefined = undefined
    private get contentIntelligenceId() : string
    {
        if (!this._contentIntelligenceId || this._contentIntelligenceId == '') {
            try {
                this._contentIntelligenceId = document.cookie.match('(^|;)\\s*iv\\s*=\\s*([^;]+)')?.pop() || ''
            } catch {
                this._contentIntelligenceId = ''
            }
        }
        return this._contentIntelligenceId
    }
    private _contentIntelligenceId : string | undefined = undefined
}

export default DataPlatformService