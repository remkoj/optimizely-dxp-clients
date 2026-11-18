import type { NextRequest, NextResponse } from 'next/server'
import type { cookies } from "next/headers"
import { v4 as createGuid } from 'uuid'
import getConfig from '../config'

/**
 * Cookie attributes supported when setting the Optimizely visitor ID.
 *
 * The default cookie lifetime is 365 days. The cookie is readable by browser
 * JavaScript because client-side Optimizely integrations use the same ID.
 */
export type VisitorCookieOptions = {
  /** Cookie domain, when sharing the visitor ID across subdomains. */
  domain?: string
  /** Cookie lifetime in seconds. Defaults to 365 days. */
  maxAge?: number
  /** Absolute cookie expiration time. */
  expires?: Date
  /** SameSite behavior. Defaults to `"strict"`. */
  sameSite?: boolean | 'lax' | 'strict' | 'none'
  /** Whether the cookie is restricted to HTTPS. Defaults to false in development and true otherwise. */
  secure?: boolean
  /** Cookie path. Defaults to `"/"`. */
  path?: string
}

const generatedVisitorIds = new WeakMap<object, string>()

/**
 * Returns the visitor ID from the configured frontend cookie or creates one. A
 * generated ID is remembered for the request, so every call for the same request
 * (for example by the code of a proxy and by `withOptimizelyOne`) returns the same
 * ID, regardless of the order in which they run.
 *
 * @param request The current Next.js request.
 * @returns The existing visitor ID, or a new UUID without hyphens.
 */
export function getOrCreateVisitorId(request: NextRequest): string {
  const existing = request.cookies.get(getConfig().FrontendCookie)?.value
  if (existing)
    return existing
  let generated = generatedVisitorIds.get(request)
  if (!generated) {
    generated = createGuid().replaceAll('-', '')
    generatedVisitorIds.set(request, generated)
  }
  return generated
}

/**
 * Anything the visitor cookie can be read from: the cookie store of `next/headers`
 * (Server Components, route handlers) or a request with `cookies`, such as the
 * `NextRequest` in a proxy.
 */
export type VisitorCookieSource =
  | Awaited<ReturnType<typeof cookies>>
  | { cookies: { get(name: string): { value: string } | undefined } }

/**
 * Reads the visitor ID from the configured frontend cookie.
 *
 * @param source The cookie store returned by `next/headers`, or a request (`NextRequest` in a proxy).
 * @returns The visitor ID, or `undefined` when no cookie is present.
 */
export function getVisitorId(source: VisitorCookieSource): string | undefined {
  const store = 'cookies' in source ? source.cookies : source
  return store.get(getConfig().FrontendCookie)?.value
}

/**
 * Reads the ODP visitor ID (`vuid`) that the ODP tracker (`zaius.js`) stores in
 * the `vuid` cookie.
 *
 * @param source The cookie store returned by `next/headers`, or a request (`NextRequest` in a proxy).
 * @returns The ODP visitor ID without dashes, or `undefined` when the tracker hasn't set the cookie yet.
 */
export function getOdpVisitorId(source: VisitorCookieSource): string | undefined {
  const store = 'cookies' in source ? source.cookies : source
  return store.get('vuid')?.value?.split('|')[0]?.replaceAll('-', '') || undefined
}

/**
 * Sets the visitor ID cookie on a response using the configured cookie name.
 *
 * By default, the cookie lasts 365 days and is renewed whenever this helper is
 * called. It remains readable by client-side Optimizely integrations.
 *
 * @param response The response to add the visitor cookie to.
 * @param visitorId The visitor ID to persist.
 * @param options Optional cookie attributes that override the defaults.
 * @returns The response, for convenient composition.
 */
export function addVisitorId<T = unknown>(
  response: NextResponse<T>,
  visitorId: string,
  options: VisitorCookieOptions = {}
): NextResponse<T> {
  const config = getConfig()
  response.cookies.set({
    name: config.FrontendCookie,
    value: visitorId,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'strict',
    path: '/',
    secure: config.RuntimeEnv !== 'development',
    ...options
  })
  return response
}

export default {
  getVisitorId,
  getOdpVisitorId,
  getOrCreateVisitorId,
  addVisitorId
}