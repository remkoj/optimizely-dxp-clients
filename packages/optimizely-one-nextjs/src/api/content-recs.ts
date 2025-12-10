import type { ApiService } from './types'

import { ContentRecs } from '../products'
import { readConfigFromEnv } from '../config'
import * as Responses from './responses'

export const ContentRecsApiService: ApiService<any> = {
  for: { path: '/crecs', verb: 'get' },
  handler: async (query, cookies) => {
    // Read configuration
    const optiOneConfig = readConfigFromEnv();
    if (!optiOneConfig.ContentRecsHost)
      return Responses.NotFound

    const crId = ContentRecs.Tools.getVisitorID(await cookies)
    // Identify visitor
    const crId = ContentRecs.Tools.getVisitorID(cookies)
    if (!crId)
      return [{ total_hits: 0, content: [] }, 200]

    // Send request to Content Recommendations, and strip JSONP function call
    const recsService = new URL(`https://api.${optiOneConfig.ContentRecsHost}/1.0/users/idio_visitor_id:${crId}/content?callback=fn`)
    query.forEach((value, name) => {
      if (name.toLowerCase() != 'callback')
        recsService.searchParams.set(name, value)
    })
    const snippetResponse = await fetch(recsService, { cache: 'no-store' })
    if (!snippetResponse.ok)
      return [{ error: { status: snippetResponse.status, message: snippetResponse.statusText } }, snippetResponse.status]
    const body = await snippetResponse.text()
    const jsonData = body.substring(body.indexOf('{'), body.lastIndexOf('}') + 1)

    // Convert and return data
    try {
      const recsData = JSON.parse(jsonData)
      if (recsData.next_page)
        recsData.next_page = (new URL(recsData.next_page)).search
      return [ recsData, 200 ]
    } catch (e) {
      console.error("Error in processing Content Recommendations", e)
      return [{ error: { status: 500, message: "Unable to parse Content Recommendations data" } }, 500]
    }
  }
}

export default ContentRecsApiService
