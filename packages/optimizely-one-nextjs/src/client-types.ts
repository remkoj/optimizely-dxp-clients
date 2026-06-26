declare global
{
  interface Window {
    zaius?: OptimizelyDataPlatformApi
    _iaq?: OptimizelyContentRecsApi
    optimizely?: OptimizelyWebExperimentationApi
  }
}

/**
 * Contract implemented by Optimizely One client services.
 *
 * A service can expose one or more optional capabilities (activation, tracking,
 * profile updates/discovery) and provides access to an underlying browser API.
 *
 * @typeParam T The concrete browser API client type exposed by the service.
 * @typeParam SC The service code type used to identify the service.
 */
export interface OptimizelyOneService<T = unknown, SC = string>
{
  /**
     * Sort order for service execution. Lower values run first.
     */
  order: Readonly<number>

  /**
     * Indicates whether the service is currently active.
     */
  isActive: Readonly<boolean>

  /**
     * Stable service identifier used to locate a service by code.
     */
  code: Readonly<SC>

  /**
     * Enables or disables debug logging for this service instance.
     */
  debug: boolean

  /**
     * Perform any actions that must be done to apply the capabilities of this
     * service on the page. This function MUST NOT perform behaviour tracking of
     * any kind.
     * 
     * @param       path        The path for which to activate.
     * @returns     void
     */
  activatePage?: (path: string) => void

  /**
     * Perform any actions that must be done to performt the pageview tracking
     * needed for this service.
     * 
     * @param       path        The path for which to activate.
     * @returns     void
     */
  trackPage?: (path: string) => void

  /**
     * Tracks a custom event through this service.
     *
     * @param event The event payload.
     * @returns void
     */
  trackEvent?: (event: OptimizelyOneEvent) => void

  /**
     * Updates profile data known to this service.
     *
     * @param profileData Complete new profile
     * @returns void
     */
  updateProfile?: (profileData: OptimizelyOneProfileData) => void

  /**
     * Discovers profile data from this service.
     *
     * @param signal Optional abort signal used to cancel discovery.
     * @returns A partial profile payload discovered by this service.
     */
  discoverProfileData?: (signal?: AbortSignal | null) => Promise<Partial<OptimizelyOneProfileData>>

  /**
     * Retrieves the underlying browser API client for this service.
     *
     * @returns The browser API instance, or `undefined` when unavailable.
     */
  getBrowserApi: () => T | undefined
}

export type OptimizelyOneServiceWithCapability<T = unknown, SC extends string = string, K extends keyof OptimizelyOneService = keyof OptimizelyOneService> = Omit<OptimizelyOneService<T,SC>,K | 'active'> & Required<Pick<OptimizelyOneService<T,SC>,K> & { active: true }>

export type OptimizelyOneEvent = NavigationSearchEvent | {
  event: string
  action: string
  [key: string]: string | number | boolean
}

type NavigationSearchEvent = {
  event: "navigation",
  action: "search",
  search_term: string
}

export type OptimizelyOneProfileData = {
  /**
   * The Pseudo ID used by Optimizely Feature experimentation
   */
  feature_experimentation_id?: string,
  /**
   * The Pseudo ID used by Optimizely Content Recommendations 
   * and intelligence
   */
  content_intelligence_id?: string,
  /**
   * Any other ID tracked within the profile, these IDs are
   * considered PII and thus should not be sent to systems
   * that may not process PII.
   */
  ids: Record<string, string>,
  /**
   * Any custom field to be tracked within the profile, the
   * values here may not be PII.
   */
  custom: Record<string, string | number | boolean>
  /**
   * Any custom field to be tracked within the profile, the
   * values here may or may not be PII
   */
  customPII: Record<string, string | number | boolean>
}

export const DefaultProfileData : OptimizelyOneProfileData = {
  custom: {},
  customPII: {},
  ids: {}
}

export type OptimizelyDataPlatformApi = {
  event: (name: string, data?: { [param: string]: unknown }) => Promise<void>
  dispatch: (group: string, action: string, params?: { [param: string]: unknown }) => Promise<void>
  customer: (customerIds: Record<string,string|number>, customerAttributes?: Record<string, unknown>) => void
}

export type OptimizelyContentRecsApi = {
  push: (command: [string, unknown]) => void
}

export type OptimizelyWebExperimentationApi = {
  initialized?: boolean
  push: (data: { type: string, [paramName: string]: unknown }) => void
  get?: <T extends keyof OptlyWebGet>(what: T) => OptlyWebGet[T]
}

export type OptlyWebGet = {
  state: {
    getPageStates: (filters?: { isActive: boolean }) => { 
      [id: string]: { 
        id: string, 
        apiName: string, 
        name: string | null, 
        isActive: boolean 
      }
    },
    getExperimentStates: (filters?: { isActive: boolean }) => {
      [id: string]: {
        audiences: unknown[]
        experimentName: string | null
        id: string
        isActive: boolean
        isInExperimentHoldback: boolean
        reason?: undefined | string
        variation: {
          id: string
          name: string | null
        }
        visitorRedirected: boolean
      }
    },
    getCampaignStates: (filters?: { isActive: boolean }) => {
      [id: string]: {
        allExperiments: {
          id: string
          name: string
        }[]
        audiences: {
          id: string
          name: string
        }[]
        campaignName: string
        experiment: {
          campaignName: string
          id: string
          name: string
        }
        id: string
        isActive: boolean
        isInCampaignHoldback: boolean
        reason?: unknown
        variation: {
          id: string
          name: string
        }
        visitorRedirected: boolean
      }
    }
  }
  data: {
    projectId: string
    accountId: string
    revision: string
  }
  visitor_id: {
    [strategy: string]: string
  }
  visitor: {
    visitorId: string
    source_type: string
    referrer: string | null
    first_session: boolean
    device_type: string
    device: string
    browser: string
    browserVersion: string
  }
}
