import { type NextRequest, NextResponse } from "next/server.js";

type Middleware<T = any> = (request: NextRequest) => Promise<NextResponse<T>> | NextResponse<T>

/**
 * Create a Next.JS middleware, which enhances the current middleware with an
 * automatic rewrite from the "old" CMS Preview URLs to the "new" CMS Preview
 * URLs. This will make "side-by-side" previews work, as well as can help with
 * supporting CMS 12
 * 
 * @param       middleware      Your middleware, which should be wrapped by 
 *                              this middleware
 * @param       adminSlug       The slug used by Optimizely CMS for the admin
 *                              routes (defaults to "ui", a common alternative
 *                              is "episerver")
 * @param       previewRoute    The preview route within the frontend (defaults
 *                              to "/preview")
 * @returns     The new middleware
 */
export function withEditFallback<T = unknown>(middleware?: Middleware<T>, adminSlug: string = "ui", previewRoute: string = "/preview"): Middleware<T> {
  const previewPath = `/${adminSlug}/CMS/Content/`
  const wrappedMiddleware: Middleware<T> = request => {
    if (
      request.nextUrl.pathname.startsWith(previewPath) &&
      request.nextUrl.pathname.includes(",,") &&
      request.nextUrl.searchParams.has('epieditmode')
    ) {
      const [path, versionInfo] = request.nextUrl.pathname.split(",,", 2)
      const [contentId, versionId] = versionInfo.split("_", 2)
      const ctx = request.nextUrl.searchParams.get('epieditmode') == "true" ? "edit" : "preview"
      const token = request.nextUrl.searchParams.get('preview_token') || request.nextUrl.searchParams.get('token') || process.env.OPTIMIZELY_PUBLISH_TOKEN || "use-hmac"
      let requestPath = path.replace(previewPath, "/")
      if (!requestPath.endsWith('/'))
        requestPath = requestPath + '/'

      const rewrittenUrl = new URL(previewRoute, request.url)
      rewrittenUrl.searchParams.set("key", contentId)
      rewrittenUrl.searchParams.set("ver", versionId)
      rewrittenUrl.searchParams.set("loc", "ALL") // Locale cannot be inferred from URL, however a contentId/versionId should always be unique
      rewrittenUrl.searchParams.set("ctx", ctx)
      rewrittenUrl.searchParams.set("preview_token", token)
      rewrittenUrl.searchParams.set("path", requestPath)
      return NextResponse.rewrite(rewrittenUrl) as NextResponse<T>
    }

    return middleware ? middleware(request) : (NextResponse.next() as NextResponse<T>)
  }
  return wrappedMiddleware
}