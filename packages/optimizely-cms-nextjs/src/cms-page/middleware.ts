import 'server-only'
import { NextResponse, type NextRequest, type NextProxy } from "next/server.js"
import { type ChannelDefinition } from "@remkoj/optimizely-graph-client"
import { match } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'

/**
 * Wrap the provided middleware with enforcement of the language code as the first
 * slug in the URL.
 * 
 * @param       next        The Next.JS Middleware to wrap, will be invoked if there's no redirect needed
 * @param       channel     The Optimizely CMS Application definition
 * @param       debug       When set to debug, redirects will be temporary (302) and information will be 
 *                          logged. If omitted, it will determine debug mode based upon the NODE_ENV value.
 * @returns     The newly constructed Next.JS Middleware
 */
export function withLanguagePrefix<T extends NextProxy>(next: T, channel: ChannelDefinition, enableDebug?: boolean): T {
  const debug = enableDebug === undefined ? process.env.NODE_ENV === 'development' : enableDebug;
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

  const newMiddleware: NextProxy = (request, ...params) => {
    const pathname = request.nextUrl.pathname;

    // Only process non internal routes
    if (pathname.startsWith("/_") || pathname.startsWith("/."))
      return next(request, ...params);

    // Get the locale slug from the URL
    const pathSlugs = pathname.split('/').filter(x=>x);
    const localeSlug = pathSlugs.length >= 1 && slugs.includes(pathSlugs.at(0) ?? '-') ? pathSlugs.at(0) : undefined;

    if (!localeSlug) {
      // We don't have a locale, so we're going to redirect to the best matching
      // locale.
      const locale = getLocale(request)
      const slug = channel.resolveSlug(locale)
      if (debug)
        console.log(`💬 [Language Prefix Middleware] Detected locale missing in ${pathname}, redirecting to /${slug}${pathname}`)
      const newUrl = request.nextUrl.clone()
      newUrl.pathname = `/${slug}${pathname}`
      return NextResponse.redirect(newUrl, {
        status: debug ? 302 : 301
      })
    } else {
      // We have a locale, so we're going to make it available to the application
      // using request headers.
      const locale = channel.slugToLocale(localeSlug);
      request.headers.append("x-app-locale", locale ?? channel.defaultLocale);
      request.headers.append("x-app-locale-slug", localeSlug);

      if (debug)
        console.log(`💬 [Language Prefix Middleware] Detected locale ${ locale }`)
    }
    return next(request, ...params)
  }
  return newMiddleware as T
}
