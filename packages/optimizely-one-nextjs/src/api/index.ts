import 'server-only'
import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { ApiService } from './types'
import ProfileApiService from './profile-api-service'
import GraphInfoApiService from './graph-info-service'
import ExperimentationApiService from './experimentation-api'
import ContentRecsApiService from './content-recs'
import ContentRecsGoalsService from './content-goals'

type RequestContext = { params: Promise<Record<string, string | string[]>> }
type OptimizelyOneApi = (req: NextRequest, ctx: RequestContext) => Promise<NextResponse>

export type OptimizelyOneApiConfig = {
  /**
   * The URL Parameter you've setup in your Next.JS router to catch the 
   * full path to be handled.
   */
  pathParameterName: string

  /**
   * Inject any project specific services into the OptimizelyOne API
   */
  services: ApiService[]
}

export function createOptimizelyOneApi(config?: Partial<OptimizelyOneApiConfig>): OptimizelyOneApi {
  const pathParameterName = config?.pathParameterName ?? 'path'
  const services = [
    ...(config?.services || []),
    ProfileApiService,
    GraphInfoApiService,
    ExperimentationApiService,
    ContentRecsApiService,
    ContentRecsGoalsService
  ]

  // Basic service matcher, but get's the job done for now
  function matchService(verb: string, path: string, serviceFor: ApiService['for']): boolean {
    return serviceFor.path.toLowerCase() == path.toLowerCase() &&
      serviceFor.verb.toLowerCase() == verb.toLowerCase()
  }

  async function handler(request: NextRequest, { params: asyncParams }: RequestContext): Promise<NextResponse> {
    // Determine the current path & basePath for handling the request
    const params = await asyncParams
    let apiPath: string | string[] | undefined = params[pathParameterName]
    if (!apiPath) apiPath = '/'
    else if (Array.isArray(apiPath)) apiPath = '/' + apiPath.join('/')
    else if (!apiPath.startsWith('/')) apiPath = '/' + apiPath
    const path: string = apiPath
    //const basePath = apiPath == '/' ? request.nextUrl.pathname : request.nextUrl.pathname.endsWith(apiPath) ? request.nextUrl.pathname.substring(0, request.nextUrl.pathname.lastIndexOf(apiPath)) : ''
    const verb = request.method

    // Find the service
    const apiService = services.find(service => matchService(verb, path, service.for))
    if (!apiService)
      return NextResponse.json({ error: { status: 404, message: "Not found" } }, { status: 404 })

    // Invoke the service
    const c = cookies()
    const [response, statusCode, contentType] = await apiService.handler(request.nextUrl.searchParams, c)

    const headers = new Headers();
    if (contentType)
      headers.set("Content-Type", contentType)

    // Return the outcome
    if (typeof response == 'string')
      return new NextResponse(response, { headers, status: statusCode })
    return NextResponse.json(response, { headers, status: statusCode })
  }
  return handler
}