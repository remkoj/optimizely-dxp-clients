'use client'
import { createContext, useContext, useCallback, useMemo, useState, type PropsWithChildren, type Dispatch, type SetStateAction, useEffect } from "react";
import { deepmerge as createDeepmerge } from "@fastify/deepmerge"
import { diff } from "deep-object-diff"

// Api from package
import type * as ClientApi from '../client-types';
import { DefaultProfileData } from "../client-types";
import type { SupportedProductNames } from './types';
import * as Filters from './service-filters';

// Default services to be always included in the context, but can be toggled on/off based on the enabledOptimizelyServices
import WebExperimenationService from '../products/web-experimentation/client'
import DataPlatformService from '../products/data-platform/client'
import ContentRecsService from '../products/content-recs/client'
import { useLocalState } from "./use-local-state";

// Create a deepmerge instance for merging profile data from multiple sources
const deepmerge = createDeepmerge({
  onlyDefinedProperties: true
});

/**
 * Context contract for Optimizely One integrations.
 *
 * Provides runtime flags, active service management, event dispatching,
 * and capability-specific service selectors used by consumers.
 */
export type OptimizelyOneContextType = Readonly<{
  /**
   * With tracking completely disabled, all events will be stopped by
   * the OptimizelyOne hook. The "PageActivator" component will propagate
   * this instruction to all configured Optimizely One services
   */
  disableTracking: Readonly<boolean>,

  /**
   * With auto-tracking disabled, the "PageActivator" component will not 
   * automatically track a generic pageview for all configured Optimizely
   * One services.
   */
  disableAutotracking: Readonly<boolean>

  /**
   * The list of the active Optimizely One Services registered with the
   * context. Inactive services are filtered out and will not be part of
   * this collection.
   */
  services: ReadonlyArray<ClientApi.OptimizelyOneService>

  /**
   * Whether debug output is enabled for registered services.
   */
  debug: Readonly<boolean>

  /**
   * Updates debug mode for the context.
   */
  setDebug: Dispatch<SetStateAction<boolean>>,

  /**
   * Adds a service to the context.
   *
   * This allows dynamic service registration after initialization, but requires
   * the full service definition, including `isActive`.
   *
   * @param service The service instance to add.
   */
  addService: (service: ClientApi.OptimizelyOneService) => void

  /**
   * Removes a service from the context.
   *
   * The exact same service instance must be passed as was used during add.
   * Built-in default services cannot be removed with this method.
   *
   * @param service The service instance to remove.
   */
  removeService: (service: ClientApi.OptimizelyOneService) => void

  /**
   * Tracks an event through the generic event API.
   *
   * All configured services that support event tracking receive this event.
   *
   * @param event The event payload to send.
   */
  track: (event: ClientApi.OptimizelyOneEvent) => void

  /**
    * Discovers profile data from active discovery-capable services.
    *
    * @param signal Optional abort signal used to cancel discovery requests.
    * @returns A promise that resolves when profile discovery and merge are complete.
   */
  discoverProfileData: (signal?: AbortSignal | null) => Promise<void>

  /**
    * Merges the provided profile data into the current profile state.
    *
    * @param profileData Profile data patch to merge.
   */
  updateProfile: (profileData: Partial<ClientApi.OptimizelyOneProfileData>) => void

  /**
   * Retrieves active services that support the page activation step.
   *
   * @returns A list of active services with `activatePage` capability.
   */
  getActivatePageServices: () => ClientApi.OptimizelyOneServiceWithCapability<any, string, 'activatePage'>[]

  /**
   * Retrieves active services that support page-view tracking.
   *
   * @returns A list of active services with `trackPage` capability.
   */
  getTrackPageServices: () => ClientApi.OptimizelyOneServiceWithCapability<any, string, 'trackPage'>[]

  /**
   * Retrieves active services that support profile updates.
   *
   * @returns A list of active services with `updateProfile` capability.
   */
  getProfileServices: () => ClientApi.OptimizelyOneServiceWithCapability<any, string, 'updateProfile'>[]

  /**
   * Retrieves active services that can discover profile data.
   *
   * @returns A list of active services with `discoverProfileData` capability.
   */
  getProfileDataSources: () => ClientApi.OptimizelyOneServiceWithCapability<any, string, 'discoverProfileData'>[]

  /**
   * Retrieves an individual active service by its code.
   *
   * @param code The service code.
   * @returns The matching service, or `undefined` when not found.
   */
  getService: <SC extends string>(code: SC) => ClientApi.OptimizelyOneService<any, SC> | undefined
}>

const throwNoContextDefined = (): never => {
  throw new Error("No context defined")
}

const DefaultOptimizelyOneContextValues : OptimizelyOneContextType = {
  disableTracking: false,
  disableAutotracking: false,
  services: [],
  debug: false,
  setDebug: throwNoContextDefined,
  addService: throwNoContextDefined,
  removeService: throwNoContextDefined,
  track: throwNoContextDefined,
  getActivatePageServices: throwNoContextDefined,
  getTrackPageServices: throwNoContextDefined,
  getProfileServices: throwNoContextDefined,
  getProfileDataSources: throwNoContextDefined,
  getService: throwNoContextDefined,
  discoverProfileData: throwNoContextDefined,
  updateProfile: throwNoContextDefined
}
const OptimizelyOneContext = createContext<OptimizelyOneContextType>(DefaultOptimizelyOneContextValues)
OptimizelyOneContext.displayName = "Optimizely One: Context"

/**
 * Props accepted by `OptimizelyOneProvider`.
 *
 * `value` supplies initial context flags and optional additional services.
 * `enabledOptimizelyServices` controls which built-in product services are enabled.
 */
export type ProviderProps = PropsWithChildren<{
  /**
   * Initial context values and optional custom services.
   */
  value?: {
    /**
     * Disables all event tracking when `true`.
     */
    disableTracking?: boolean | undefined;

    /**
     * Disables automatic page-view tracking when `true`.
     */
    disableAutotracking?: boolean | undefined;

    /**
     * Additional services to register alongside built-in services.
     */
    services?: readonly ClientApi.OptimizelyOneService[] | undefined;

    /**
     * Enables debug logging for service operations when `true`.
     */
    debug?: boolean;
  },

  /**
   * Optional allow-list for built-in product services.
   */
  enabledOptimizelyServices?: Array<SupportedProductNames>
}>

/**
 * Provides Optimizely One context values to descendant components.
 *
 * It composes built-in product services with optional additional services,
 * filters active capabilities, and exposes tracking and service access APIs.
 *
 * @param props Provider configuration and children.
 * @returns The Optimizely One context provider element.
 */
export function OptimizelyOneProvider(
{ 
  value: { 
    disableTracking = false,
    disableAutotracking = false,
    services = [],
    debug = false
  } = {}, 
  children, 
  enabledOptimizelyServices
}: ProviderProps)
{
  // Local state to hold the current profile data, allowing it to be updated and
  // accessed across the context
  const [ currentProfileData, setCurrentProfileData ] = useLocalState<ClientApi.OptimizelyOneProfileData>('profileData', DefaultProfileData)

  // Track the debug state in the context, to allow dynamic enabling/disabling
  // of debug mode after initialization.
  const [ ctxDebug, setCtxDebug ] = useState<boolean>(debug)

  // Track the additional services through state, to allow dynamic
  // adding/removing of services after initialization.
  const [ additionalServices, setAdditionalServices ] = useState<ReadonlyArray<ClientApi.OptimizelyOneService>>(services)

  // Memoize the active services to avoid unnecessary re-renders and 
  // computations in the context consumers. 
  const activeServices = useMemo(() => {
    const defaultServices = [
      new WebExperimenationService(enabledOptimizelyServices),
      new DataPlatformService(enabledOptimizelyServices),
      new ContentRecsService(enabledOptimizelyServices)
    ]
    const allServices = [...defaultServices, ...additionalServices]
    allServices.forEach(s => s.debug = ctxDebug);
    return allServices.filter(s => s.isActive).sort((a, b) => a.order - b.order)
  }, [additionalServices, enabledOptimizelyServices, ctxDebug])

  // Use memoized event tracking function to ensure stable reference for 
  // context consumers
  const track = useCallback((event: ClientApi.OptimizelyOneEvent) => {
    if (!disableTracking) {
      if (ctxDebug) {
        console.groupCollapsed(`📢 [Optimizely One] Tracking event: ${event.event}` )
        console.log('Event data:', event)
      }
      activeServices.forEach(service => {
        if (Filters.isActiveWithEventTracker(service)) {
          service.trackEvent(event)
        }
      })
      if (ctxDebug) console.groupEnd()
    } else if (ctxDebug) console.log('🔐 [Optimizely One] Tracking disabled, ignored event')
  }, [activeServices, ctxDebug])

  // Use memoized profile discovery function to ensure stable reference for
  // context consumers and to allow triggering profile refresh from multiple
  // places (e.g. page activator effect and manual trigger) without causing
  // unnecessary re-renders.
  const discoverProfileData = useCallback(async (signal?: AbortSignal | null) => {
    if (ctxDebug) console.log('📢 [Optimizely One] Updating profile data from sources...')
    const discoveryServices = activeServices.filter(Filters.isActiveWithProfileDiscovery)
    const results = await Promise.allSettled(
      discoveryServices.map(service => service.discoverProfileData(signal ?? undefined))
    )
    const mergedProfileData = results.reduce(
      (merged, current) =>
        current.status === 'fulfilled'
          ? deepmerge(merged, current.value)
          : merged,
      currentProfileData
    )

    const profileDataDiff = diff(currentProfileData, mergedProfileData)
    if (Object.keys(profileDataDiff).length > 0) {
      if (ctxDebug) console.log(' - Profile data changes detected:', profileDataDiff)
      setCurrentProfileData(mergedProfileData)
    } else if (ctxDebug) {
      console.log(' - No changes in profile data detected.')
    }
  }, [currentProfileData, activeServices, ctxDebug]);

  // Callback to update profile data, which can be passed to services that support
  // profile updates. This allows those services to trigger profile data changes
  // that are then propagated to all other services and context consumers.
  const updateProfile = useCallback((profileData: Partial<ClientApi.OptimizelyOneProfileData>) => {
    if (ctxDebug) console.log('📢 [Optimizely One] Updating profile data with:', profileData)
    const mergedProfileData = deepmerge(currentProfileData, profileData)
    const profileDataDiff = diff(currentProfileData, mergedProfileData)
    if (Object.keys(profileDataDiff).length > 0) {
      if (ctxDebug) console.log(' - Profile data changes detected:', profileDataDiff)
      setCurrentProfileData(mergedProfileData)
    } else if (ctxDebug) {
      console.log(' - No changes in profile data detected.')
    }
  }, [currentProfileData, ctxDebug])

  // Effect to update profile data across all services whenever it changes
  useEffect(() => {
    if (ctxDebug) 
      console.log('📢 [Optimizely One] Profile data updated:', currentProfileData);
    activeServices.forEach(service => {
      if (Filters.isActiveWithUpdateProfile(service)) {
        service.updateProfile(currentProfileData)
      }
    })
  }, [currentProfileData, activeServices, ctxDebug]);

  // Memoize the entire context value to avoid unnecessary re-renders in context consumers
  // when any of the context values change. This ensures that consumers only re-render
  // when the specific context values they use actually change.
  const contextValue = useMemo<OptimizelyOneContextType>(() => {
    return {
      disableTracking,
      disableAutotracking,
      services: activeServices,
      debug: ctxDebug,
      setDebug: setCtxDebug,
      addService: (service: ClientApi.OptimizelyOneService) => setAdditionalServices(prev => [...prev, service]),
      removeService: (service: ClientApi.OptimizelyOneService) => setAdditionalServices(prev => prev.filter(s => s !== service)),
      track,
      getActivatePageServices: () => activeServices.filter(Filters.isActiveWithActivatePage),
      getTrackPageServices: () => activeServices.filter(Filters.isActiveWithTrackPage),
      getProfileServices: () => activeServices.filter(Filters.isActiveWithUpdateProfile),
      getProfileDataSources: () => activeServices.filter(Filters.isActiveWithProfileDiscovery),
      getService: <SC extends string>(code: SC) => activeServices.find(s => s.code === code) as ClientApi.OptimizelyOneService<any, SC> | undefined,
      discoverProfileData,
      updateProfile
    }
  }, [ disableTracking, disableAutotracking, activeServices, ctxDebug, track, discoverProfileData, updateProfile ])

  return <OptimizelyOneContext.Provider value={contextValue}>{ children }</OptimizelyOneContext.Provider>
}
OptimizelyOneProvider.displayName = "Optimizely One: State & Context provider"

/**
 * Retrieves the current Optimizely One context value.
 *
 * @returns The active `OptimizelyOneContextType` instance.
 */
export function useOptimizelyOne() {
  return useContext(OptimizelyOneContext)
}
