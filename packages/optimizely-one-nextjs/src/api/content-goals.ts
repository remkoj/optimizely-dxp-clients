import type { ApiService } from './types'
import { ContentRecs } from '../products'

export type GoalsReponse = {
    goals: Array<{
        /**
         * The name of the goal within Content Recommendations
         */
        goal: string,

        /**
         * The relevancy of the goal, as a float between 0 and 1
         */
        score: number
    }>
}

export const ContentRecsGoalsService : ApiService<GoalsReponse> = {
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