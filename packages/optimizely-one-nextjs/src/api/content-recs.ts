import type { ApiService } from './types'

import { ContentRecs } from '../products'

export const ContentRecsApiService : ApiService<any> = {
    for: { path: '/crecs', verb: 'get' },
    handler: async (query, cookies) => {
        const crId = ContentRecs.Tools.getVisitorID(cookies)
        if (!crId)
            return [{total_hits: 0, content: []},200]
        const recsService = new URL(`https://api.idio.co/1.0/users/idio_visitor_id:${ crId }/content?callback=fn`)
        query.forEach((value, name) => {
            if (name.toLowerCase() != 'callback')
                recsService.searchParams.set(name, value)
        })
        const snippetResponse = await fetch(recsService, { cache: 'no-store' })
        if (!snippetResponse.ok)
            return [{error: { status: snippetResponse.status, message: snippetResponse.statusText }},snippetResponse.status]
        const body = await snippetResponse.text()
        const jsonData = body.substring(body.indexOf('{'),body.lastIndexOf('}')+1)
        try {
            const recsData = JSON.parse(jsonData)
            return [
                {
                    ...recsData,
                    next_page: (new URL(recsData.next_page)).search
                },
                200
            ]
        } catch {
            return [{error: { status: 500, message: "Unable to parse Content Recommendations data" }},500]
        }
    }
}

export default ContentRecsApiService