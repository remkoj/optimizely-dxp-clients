'use client'

import * as ClientApi from '../../client-types'
import * as GlobalClientTypes from '../../components/types'

export class ContentRecsService implements ClientApi.OptimizelyOneService<ClientApi.OptimizelyContentRecsApi>
{
    private _apiEnabled : boolean = true
    private _clientEnabled : boolean = true

    constructor(enabledServices?: Array<GlobalClientTypes.SupportedProductNames>) {
        if (enabledServices) {
            this._apiEnabled = enabledServices.includes("contentRecsApi")
            this._clientEnabled = enabledServices.includes("contentRecsClient")
        } else {
          this._apiEnabled = false
          this._clientEnabled = false
        }
    }

    public get isApiEnabled() : boolean {
        return this._apiEnabled
    }
    public get isClientEnabled() : boolean {
        return this._clientEnabled
    }

    public order : Readonly<number> = 300
    public code : Readonly<string> = "crecs"
    public debug : boolean = false
    public endpoint : string = "/api/me/cgoals"
    public get isActive() : boolean {
        return this._apiEnabled || this._clientEnabled
    }

    public trackPage()
    {
        if (!this._clientEnabled) return
        const idio = this.getBrowserApi()
        if (!idio) return
        if (this.debug) console.log("Content Recommendations / Analytics - Tracking page view")
        idio.push(['track', 'consume'])
    }

    public trackEvent(event: ClientApi.OptimizelyOneEvent)
    {
      const idio = this.getBrowserApi();
      if (!idio) return; // We're disabled so, stop here
      const goalName = [event.event, event.action].filter(x=>x).join('-');
      if (!goalName || goalName.length == 0) return; // Only track if we've a goal
      if (this.debug) console.log("Content Recommendations / Analytics - Tracking goal: " + goalName)
      idio.push(['goal', goalName]);
      idio.push(['track', 'convert']);
    }

    public getBrowserApi()
    {
        try {
            if (!this._clientEnabled) return undefined
            if (!window._iaq) 
                window._iaq = [] as [string, any][]
            return window._iaq
        } catch {
            return undefined
        }
    }

    public async discoverProfileData(signal?: AbortSignal | null) : Promise<ClientApi.OptimizelyOneProfileData>
    {
        if (!this._apiEnabled)
            return { custom: {} }
        const nbg = await fetch(this.endpoint, { cache: 'no-store', signal }).then(r => r.ok ? r.json() as Promise<{ goals: Array<{ goal: string, score: number }>}> : undefined)
        return {
            custom: {
                "next_best_goal": (nbg?.goals || []).at(0)?.goal || '',
                "next_best_goals": (nbg?.goals || []).map(x => x.goal).join(", ")
            }
        }
    }
}

export default ContentRecsService
