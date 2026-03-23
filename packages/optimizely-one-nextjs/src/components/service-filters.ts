import * as ClientApi from '../client-types';

/**
 * Checks whether a service is active and supports page activation.
 *
 * @typeParam T The service context payload type.
 * @typeParam SC The service channel identifier type.
 * @param toTest The service instance to validate.
 * @returns `true` when the service is active and exposes `activatePage`.
 */
export function isActiveWithActivatePage<T = any, SC extends string = string>(toTest: ClientApi.OptimizelyOneService<T, SC>): toTest is ClientApi.OptimizelyOneServiceWithCapability<T, SC, 'activatePage'> {
    return (toTest.isActive && toTest.activatePage && typeof toTest.activatePage === 'function') ?? false
}

/**
 * Checks whether a service is active and supports page tracking.
 *
 * @typeParam T The service context payload type.
 * @typeParam SC The service channel identifier type.
 * @param toTest The service instance to validate.
 * @returns `true` when the service is active and exposes `trackPage`.
 */
export function isActiveWithTrackPage<T = any, SC extends string = string>(toTest: ClientApi.OptimizelyOneService<T, SC>): toTest is ClientApi.OptimizelyOneServiceWithCapability<T, SC, 'trackPage'> {
    return (toTest.isActive && toTest.trackPage && typeof toTest.trackPage === 'function') ?? false
}

/**
 * Checks whether a service is active and supports profile updates.
 *
 * @typeParam T The service context payload type.
 * @typeParam SC The service channel identifier type.
 * @param toTest The service instance to validate.
 * @returns `true` when the service is active and exposes `updateProfile`.
 */
export function isActiveWithUpdateProfile<T = any, SC extends string = string>(toTest: ClientApi.OptimizelyOneService<T, SC>): toTest is ClientApi.OptimizelyOneServiceWithCapability<T, SC, 'updateProfile'> {
    return (toTest.isActive && toTest.updateProfile && typeof toTest.updateProfile === 'function') ?? false
}

/**
 * Checks whether a service is active and supports profile discovery.
 *
 * @typeParam T The service context payload type.
 * @typeParam SC The service channel identifier type.
 * @param toTest The service instance to validate.
 * @returns `true` when the service is active and exposes `discoverProfileData`.
 */
export function isActiveWithProfileDiscovery<T = any, SC extends string = string>(toTest: ClientApi.OptimizelyOneService<T, SC>): toTest is ClientApi.OptimizelyOneServiceWithCapability<T, SC, 'discoverProfileData'> {
    return (toTest.isActive && toTest.discoverProfileData && typeof toTest.discoverProfileData === 'function') ?? false
}

/**
 * Checks whether a service is active and supports event tracking.
 *
 * @typeParam T The service context payload type.
 * @typeParam SC The service channel identifier type.
 * @param toTest The service instance to validate.
 * @returns `true` when the service is active and exposes `trackEvent`.
 */
export function isActiveWithEventTracker<T = any, SC extends string = string>(toTest: ClientApi.OptimizelyOneService<T, SC>): toTest is ClientApi.OptimizelyOneServiceWithCapability<T, SC, 'trackEvent'> {
    return (toTest.isActive && toTest.trackEvent && typeof toTest.trackEvent === 'function') ?? false
}
