import { NextResponse, type NextProxy, type NextRequest } from 'next/server'
import * as Session from './utils/session.js'
import getConfig from './config.js'

type ProxyResult = Awaited<ReturnType<NextProxy>>

function toNextResponse(result: ProxyResult): NextResponse {
  if (result instanceof NextResponse)
    return result

  if (result instanceof Response) {
    return new NextResponse(result.body, {
      headers: new Headers(result.headers),
      status: result.status,
      statusText: result.statusText
    })
  }

  return NextResponse.next()
}

const OVERRIDE_HEADERS = 'x-middleware-override-headers'
const REQUEST_HEADER_PREFIX = 'x-middleware-request-'

/**
 * Makes the visitor cookie visible to the rest of the current request (Server
 * Components, route handlers) by overriding the `cookie` request header, in the
 * same way `NextResponse.next({ request: { headers } })` does. Overrides set by
 * a downstream proxy are preserved. Rewrites and redirects are not affected.
 */
function exposeVisitorId(request: NextRequest, response: NextResponse, visitorId: string): void {
  const cookieName = getConfig().FrontendCookie
  const cookie = [...request.cookies.getAll().filter(c => c.name !== cookieName), { name: cookieName, value: visitorId }]
    .map(c => `${c.name}=${encodeURIComponent(c.value)}`)
    .join('; ')

  const overridden = response.headers.get(OVERRIDE_HEADERS)
  const names = new Set(overridden ? overridden.split(',') : [...request.headers.keys()])
  if (!overridden)
    for (const [name, value] of request.headers)
      response.headers.set(REQUEST_HEADER_PREFIX + name, value)
  names.add('cookie')
  response.headers.set(OVERRIDE_HEADERS, [...names].join(','))
  response.headers.set(REQUEST_HEADER_PREFIX + 'cookie', cookie)
}

/**
 * Wraps a Next.js proxy with persistent Optimizely visitor ID handling.
 *
 * The visitor ID is resolved before the supplied proxy runs. When the request
 * has no visitor cookie, or it differs from the resolved ID, the cookie is also
 * set on the request passed to the supplied proxy, so it can read the visitor ID
 * from `request.cookies` for new visitors too. The cookie is
 * added to the response, and made available to the Server Components and route
 * handlers of the same request (so the visitor is known on the very first request), preserving response headers, cookies, and
 * rewrite/redirect metadata. An unchanged cookie is left untouched. This also works when composing other proxy
 * decorators, for example `withOptimizelyOne(withMarkdownRouting(proxy))`.
 *
 * @param proxy Optional downstream proxy to execute.
 * @returns A Next.js proxy that attaches a missing or changed visitor cookie to its response and to the current request.
 */
export function withOptimizelyOne(proxy?: NextProxy): NextProxy {
  return async (request, event) => {
    const cookieName = getConfig().FrontendCookie
    const visitorId = Session.getOrCreateVisitorId(request)
    const isNewVisitor = request.cookies.get(cookieName)?.value !== visitorId
    // Let the downstream proxy see the visitor ID of a new visitor as well
    if (isNewVisitor)
      request.cookies.set(cookieName, visitorId)
    const result = proxy ? await proxy(request, event) : NextResponse.next()
    const response = toNextResponse(result)
    // Only write the cookie when it is missing or different, so the visitor's session stays stable
    if (!isNewVisitor)
      return response
    exposeVisitorId(request, response, visitorId)
    return Session.addVisitorId(response, visitorId)
  }
}
