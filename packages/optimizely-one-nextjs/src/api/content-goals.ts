import type { ApiService } from './types'
import { ContentRecs } from '../products'

export const ContentRecsGoalsService : ApiService<any> = {
    for: { path: '/cgoals', verb: 'get' },
    handler: async (query, cookies) => {
        const crId = ContentRecs.Tools.getVisitorID(cookies)
        if (!crId)
            return [{goals: []},200]
        const contentRecs = new ContentRecs.Client();
        const nextBestGoals = await contentRecs.getNextBestGoals(crId)
        return [{goals: nextBestGoals},200]
    }
}

export default ContentRecsGoalsService