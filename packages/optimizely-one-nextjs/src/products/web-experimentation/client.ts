'use client'

import * as ClientApi from '../../client-types'
import * as GlobalClientTypes from '../../components/types'

export class WebExperimenationService implements ClientApi.OptimizelyOneService<ClientApi.OptimizelyWebExperimentationApi, 'webex'>
{
    private _wxEnabled : boolean = true
    constructor(enabledServices?: Array<GlobalClientTypes.SupportedProductNames>) {
        if (enabledServices) 
            this._wxEnabled = enabledServices.includes("dataPlatform")
    }

    public order : Readonly<number> = 100
    public code : Readonly<'webex'> = 'webex'
    public debug: boolean = false
    public get isActive() : boolean {
        return this._wxEnabled
    }

    public activatePage()
    {
        if (!this._wxEnabled) return
        const webex = this.getBrowserApi()
        if (!webex) return
        webex.push({ type: 'activate' })
        if (this.debug) console.log("🚀 Web Experimentation - Activating pages")
    }

    public trackEvent(event: ClientApi.OptimizelyOneEvent)
    {
        if (!this._wxEnabled) return
        const webex = this.getBrowserApi()
        if (!webex) return
        const eventName = `${event.event}_${event.action}`
        const eventTags = Object.entries(event).reduce((tags, [prop_name, prop_value]) => {
          if (prop_name.startsWith('tag_')) {
            tags[prop_name.substring(4)] = prop_value
          }
          return tags;
        }, {} as Record<string, unknown>)
        if (this.debug) console.log("🚀 Web Experimentation - Tracking event:", { type: 'event', eventName, tags: eventTags })
        webex.push({ type: 'event', eventName, tags: eventTags })
    }

    public getBrowserApi()
    {
        try {
            if (!this._wxEnabled) return undefined
            if (!window.optimizely)
                window.optimizely = [] as unknown as ClientApi.OptimizelyWebExperimentationApi
            return window.optimizely
        } catch {
            return undefined
        }
    }

    public updateProfile(profileData: ClientApi.OptimizelyOneProfileData)
    {
        if (!this._wxEnabled) return
        const webex = this.getBrowserApi()
        if (!webex) return
        if (this.debug) console.log("🚀 Web Experimentation - Tracking attributes:", { type: 'user', attributes: profileData.custom })
        webex.push({
            type: "user",
            attributes: profileData.custom
        });
    }
}

export default WebExperimenationService
