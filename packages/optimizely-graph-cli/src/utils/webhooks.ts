import type { WebhookPayload } from '@remkoj/optimizely-graph-client/admin'

type WebhookLike = { id: string, request: { url: string, method?: string, headers?: Record<string, string> | null } }

/**
 * Create a version of a webhook URL that is safe to display: only the origin and
 * the path remain, so a legacy `?token=` query parameter is never shown.
 *
 * @param     url     The webhook URL
 * @returns   The URL without query string and fragment, or a fixed placeholder if the URL cannot be parsed
 */
export function displayUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.origin + parsed.pathname
  } catch {
    return '(invalid URL)'
  }
}

/**
 * Test if a registered webhook sends its request to the same host and path as the
 * target, regardless of query parameters (legacy `?token=` hooks) and headers.
 *
 * @param     hook    The registered webhook
 * @param     target  The URL the webhook should invoke
 * @returns   `true` when the origin and path are identical
 */
export function isSameTarget(hook: WebhookLike, target: URL): boolean {
  try {
    const hookUrl = new URL(hook.request.url)
    return hookUrl.origin == target.origin && hookUrl.pathname == target.pathname
  } catch {
    return false
  }
}

/**
 * Find the value of a header of a registered webhook, comparing the header name
 * case-insensitively.
 *
 * @param     hook    The registered webhook
 * @param     name    The name of the header
 * @returns   The value, or `undefined` when the webhook does not define the header
 */
export function getHookHeader(hook: WebhookLike, name: string): string | undefined {
  const headers = hook.request.headers
  if (!headers)
    return undefined
  const key = Object.keys(headers).find(x => x.toLowerCase() == name.toLowerCase())
  return key ? headers[key] : undefined
}

/**
 * Test if a registered webhook is exactly what the CLI would register: the target
 * URL without query string, using the requested method and sending the publish
 * token in the configured header.
 *
 * @param     hook    The registered webhook
 * @param     target  The URL the webhook should invoke (without a token)
 * @param     method  The HTTP method the webhook should use
 * @param     header  The name of the header carrying the publish token
 * @param     token   The publish token
 * @returns   `true` when no change to the registration is needed
 */
export function isCurrentRegistration(hook: WebhookLike, target: URL, method: string, header: string, token: string): boolean {
  return isSameTarget(hook, target) &&
    !new URL(hook.request.url).search &&
    (hook.request.method ?? '').toUpperCase() == method.toUpperCase() &&
    getHookHeader(hook, header) === token
}

/**
 * Build the Optimizely Graph webhook definition that sends the publish token in a header
 * instead of the URL, so the secret does not end up in URLs, access logs or webhook listings.
 *
 * @param     target  The URL the webhook should invoke (without a token)
 * @param     method  The HTTP method the webhook should use
 * @param     header  The name of the header carrying the publish token
 * @param     token   The publish token
 * @returns   The payload for the webhook registration
 */
export function buildWebhookPayload(target: URL, method: string, header: string, token: string): WebhookPayload {
  return {
    request: {
      url: target.href,
      method,
      headers: { [header]: token }
    }
  }
}
