import type { AwaitedEditPageProps, ValidatedEditPageProps, ContentRequest } from './types.js'
import { AuthMode } from '@remkoj/optimizely-graph-client'

export function isValidRequest(toTest: AwaitedEditPageProps, throwOnInvalid: boolean = false, isDevelopment: boolean = false): toTest is ValidatedEditPageProps {


  // Validate Route Params
  if (Object.getOwnPropertyNames(toTest.params).some(x => x != 'path' && x != 'lang')) {
    if (throwOnInvalid)
      throw new Error("🔴 An Optimizely CMS NextJS edit page may only have 'path' and 'lang' route parameters")
    return false
  }
  if (toTest.params.lang && typeof (toTest.params.lang) != 'string') {
    if (throwOnInvalid)
      throw new Error("🔴 The 'lang' route parameter must be a string")
    return false
  }
  if (toTest.params.path && (!Array.isArray(toTest.params.path) || !toTest.params.path.every(x => typeof (x) == 'string'))) {
    if (throwOnInvalid)
      throw new Error("🔴 The 'path' route parameter must be an array of strings")
    return false
  }

  // Validate URL Params
  const token = toTest.searchParams.preview_token ?? ""
  const validDevToken = isDevelopment && (token == AuthMode.HMAC || token == AuthMode.Basic)
  if (token.length < 20 && !validDevToken) {
    if (throwOnInvalid)
      throw new Error("🔴 The search paramater \"preview_token\" is invalid or missing")
    return false
  }

  // Validate CTX
  if (!(toTest.searchParams.ctx == undefined || toTest.searchParams.ctx == 'edit' || toTest.searchParams.ctx == 'preview')) {
    if (throwOnInvalid)
      throw new Error("The 'ctx' search parameter must be omitted or 'edit' or 'preview'")
    return false
  }

  // Validate EpiEditMode
  if (!(toTest.searchParams.epieditmode == undefined || toTest.searchParams.epieditmode.toLowerCase() == 'true' || toTest.searchParams.epieditmode.toLowerCase() == 'false')) {
    if (throwOnInvalid)
      throw new Error("The 'epieditmode' search parameter must be omitted or 'true' or 'false'")
    return false
  }

  if (toTest.searchParams.ctx && toTest.searchParams.epieditmode) {
    if (throwOnInvalid)
      throw new Error("The 'epieditmode' and 'ctx' search parameters cannot be both defined")
    return false
  }

  if (!toTest.searchParams.ctx && !toTest.searchParams.epieditmode) {
    if (throwOnInvalid)
      throw new Error("Either 'epieditmode' and 'ctx' search parameters must be defined")
    return false
  }

  return true
}

// Helper function to read the ContentID & WorkID
export function getContentRequest({ params: { path, lang }, searchParams: { preview_token: token, ...searchParams } }: ValidatedEditPageProps): ContentRequest | undefined {
  try {
    // First try to use the new style parameters
    if (searchParams.key) {
      return {
        token,
        ctx: searchParams.ctx,
        key: searchParams.key,
        locale: searchParams.loc,
        version: searchParams.ver,
        path: searchParams.path ?? null
      }
    }

    // Then fall back to old-mode URL parsing for developer URLs
    if (token == AuthMode.HMAC || token == AuthMode.Basic) {
      console.error("🦺 [OnPageEdit] Edit mode requested with developer tokens, falling back to URL parsing to determine content")
      // Determine the contentPath
      const fullPath = Array.isArray(path) ? path.map(p => decodeURIComponent(p)).join('/') : decodeURIComponent(path ?? '');
      const [cmsPath, contentString] = fullPath.split(',,', 3);
      const contentPath = (cmsPath.startsWith('/') ? cmsPath.substring(1) : cmsPath).replace(/^(ui\/){0,1}(CMS\/){0,1}(Content\/){0,1}/gi, "")
      const [contentKey, contentVersion] = (contentString ?? '').split('_', 3);
      const firstSlug: string | undefined = contentPath.split('/')[0]
      const contentLocale = firstSlug?.length == 2 || firstSlug?.length == 5 ? firstSlug : lang
      return {
        token,
        ctx: searchParams.epieditmode?.toLowerCase() == 'true' ? 'edit' : 'preview',
        key: contentKey,
        version: contentVersion,
        locale: contentLocale,
        path: '/' + contentPath + (contentPath.endsWith('/') || contentPath == '' ? '' : '/')
      }
    }

    // Finally parse the token, this is a last-restort, as it might change at any given time
    const tokenInfo = JSON.parse(atob(token.split('.')[1]))
    return {
      token,
      ctx: searchParams.epieditmode?.toLowerCase() == 'true' ? 'edit' : 'preview',
      key: tokenInfo.key,
      version: tokenInfo.ver,
      locale: tokenInfo.loc,
      path: null
    }
  } catch {
    return undefined
  }
}

export function readValue<T extends string | undefined>(variableName: string, defaultValue?: T): T extends string ? string : string | undefined {
  try {
    const stringValue = process?.env ? process.env[variableName] : undefined
    return stringValue || defaultValue as T extends string ? string : undefined
  } catch {
    return defaultValue as T extends string ? string : undefined
  }
}

export function readValueAsInt<T extends number | undefined>(variableName: string, defaultValue?: T): T extends number ? number : number | undefined {
  const stringValue = readValue(variableName)
  if (!stringValue)
    return defaultValue as T extends number ? number : undefined
  try {
    return parseInt(stringValue)
  } catch {
    return defaultValue as T extends number ? number : undefined
  }
}