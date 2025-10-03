import 'server-only'
import { NextResponse, type NextRequest, type NextMiddleware } from "next/server.js"
import { type ChannelDefinition } from "@remkoj/optimizely-graph-client"
import { match } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'

/**
 * Wrap the provided middleware with enforcement of the language code as the first
 * slug in the URL.
 * 
 * @param       next        The Next.JS Middleware to wrap, will be invoked if there's no redirect needed
 * @param       channel     The Optimizely CMS Application definition
 * @returns     The newly constructed Next.JS Middleware
 */
export function withLanguagePrefix<T extends NextMiddleware>(next: T, channel: ChannelDefinition): T {
  if (!channel)
    throw new Error("The language prefix handling requires a CMS Channel Definition")

  const defaultLocale = channel.defaultLocale
  const locales = channel.locales.map(x => x.code)
  const slugs = channel.getSlugs()

  function getLocale(request: NextRequest): string {
    const headers: { [key: string]: string } = {}
    request.headers.forEach((v, k) => { headers[k] = v })
    const languages = new Negotiator({ headers }).languages()
    return match(languages, locales, defaultLocale)
  }

  const newMiddleware: NextMiddleware = (request, ...params) => {
    const pathname = request.nextUrl.pathname
    if (pathname.startsWith("/_") || pathname.startsWith("/."))
      return next(request, ...params)
    const DEBUG = process.env.NODE_ENV == 'development'
    const pathnameIsMissingLocale = !slugs.some(slug => pathname.toLowerCase().startsWith(`/${slug.toLowerCase()}/`) || pathname.toLowerCase() === `/${slug.toLowerCase()}`)
    if (pathnameIsMissingLocale) {
      const locale = getLocale(request)
      const slug = channel.resolveSlug(locale)
      if (DEBUG)
        console.log(`💬 [Middleware] Detected locale missing in ${pathname}, redirecting to /${slug}${pathname}`)
      const newUrl = request.nextUrl.clone()
      newUrl.pathname = `/${slug}${pathname}`
      return NextResponse.redirect(newUrl, {
        status: DEBUG ? 302 : 301
      })
    }
    return next(request, ...params)
  }
  return newMiddleware as T
}