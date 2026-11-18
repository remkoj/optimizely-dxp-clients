'use client'

import { useEffect, useState } from 'react'

/** Interval, in milliseconds, at which the cookies are polled when change events are not supported. */
const POLL_INTERVAL = 500

/**
 * Matches the name of an Optimizely test cookie (`optly_<domain name>_test`), as
 * set by the bookmark or browser extension described at
 * https://docs.optimizely.com/web-experimentation/docs/set-a-test-cookie-to-preview-a-live-campaign-or-experiment
 */
const TEST_COOKIE_NAME = /^optly_.+_test$/

/**
 * Check whether an Optimizely test cookie is present in the browser, regardless of its value.
 *
 * @returns `true` when a cookie named `optly_<domain name>_test` exists, `false` otherwise (including on the server).
 */
export function hasOptimizelyTestCookie(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie
    .split(';')
    .some((cookie) => TEST_COOKIE_NAME.test(cookie.split('=')[0].trim()))
}

/**
 * Track the presence of the Optimizely test cookie, fully client side.
 *
 * The state starts as `false` (so server and first client render match) and is
 * updated after mount. Updates are driven by the Cookie Store `change` event
 * when the browser supports it, otherwise the cookies are polled every 500ms.
 *
 * @returns `true` while an Optimizely test cookie is present, `false` otherwise.
 */
export function useOptimizelyTestCookie(): boolean {
  const [present, setPresent] = useState(false)

  useEffect(() => {
    const update = () => setPresent(hasOptimizelyTestCookie())
    update()

    const store = (window as { cookieStore?: EventTarget }).cookieStore
    if (store) {
      store.addEventListener('change', update)
      return () => store.removeEventListener('change', update)
    }

    const timer = window.setInterval(update, POLL_INTERVAL)
    return () => window.clearInterval(timer)
  }, [])

  return present
}
