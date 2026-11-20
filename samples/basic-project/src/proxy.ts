import { withOptimizelyOne } from '@remkoj/optimizely-one-nextjs/proxy'
import { applyDynamicSecurityHeaders } from '@remkoj/optimizely-one-nextjs/security'
import { NextResponse, type NextProxy, type NextRequest } from 'next/server'
import { baseSources } from './security'

const isDevelopment = process.env.NODE_ENV === 'development'

// Stub: the host must implement this check. Return true for the requests
// that open the Web Experimentation visual editor (VE) for this site.
function isVisualEditorActive(request: NextRequest): boolean {
  void request
  return false
}

const baseProxy: NextProxy = (request) => {
  const response = NextResponse.next()
  // A CSP set here replaces the static one from next.config.ts, so it is built from the same base
  if (isVisualEditorActive(request))
    applyDynamicSecurityHeaders(response.headers, baseSources(isDevelopment), { webExVeActive: true })
  return response
}

export const proxy = withOptimizelyOne(baseProxy)

// The matcher of this sample is intentionally narrow. A real implementation must
// cover every page the visual editor can open, e.g.
// '/((?!api(?:/|$)|_next(?:/|$)|.*\\..*).*)' (all pages except /api, /_next and files with an extension)
export const config = {
  matcher: ['/single/:path*', '/multi/:path*']
}
