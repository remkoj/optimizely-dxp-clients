import type { ApiService } from './types'
import * as Responses from './responses'
import Session from '../utils/session'
import getConfig, { checkProductStatus } from '../config'

import { DataPlatform, ContentRecs, WebExperimentation } from '../products'

const NO_ID = 'n/a'
export const ProfileApiService: ApiService<ProfileApiResponse> = {
  for: { path: '/', verb: 'get' },
  handler: async (query, cookies) => {
    const config = getConfig()
    const products = checkProductStatus(config)
    // Check if the toolkit is enabled
    if (!config.HelperEnabled)
      return Responses.NotFound

    // Start timer
    const start = Date.now()

    // Read requested scopes
    const scopes = query.get('scope')?.toLowerCase()?.split(',')?.map(x => x.trim())
    const fetchContentTopics = !scopes || scopes.includes('topics')
    const fetchODPAudiences = !scopes || scopes.includes('audiences')
    const fetchProfileCard = !scopes || scopes.includes('profile')

    // Read all IDs
    const cookieData = await cookies
    const odpId = DataPlatform.Tools.getVisitorID(cookieData)
    const crId = ContentRecs.Tools.getVisitorID(cookieData)
    const webExId = WebExperimentation.Tools.getVisitorID(cookieData)
    const frontendId = Session.getVisitorId(cookieData)

    // Read parameters & set values
    const pageSize = config.OdpAudienceBatchSize
    const pageNumber = Math.max(stringToInt(query.get('page'), 0), 0)
    let audiencesPageCount = 0
    let audiencesCount = 0

    // Determine audiences if needed
    let audiences: { id: string, name: string }[] = []
    const odp = products.dataPlatform ? new DataPlatform.Client() : undefined;
    if (odp && fetchODPAudiences && odpId) {
      const allAudiences = await odp.getAllAudiences()
      audiencesCount = allAudiences.length

      // Split the list into manageable groups
      const chunks: string[][] = []
      allAudiences.forEach((item, idx) => {
        const chunkId = Math.floor(idx / config.OdpAudienceBatchSize);
        chunks[chunkId] = chunks[chunkId] || [];
        chunks[chunkId].push(item.id)
      });
      audiencesPageCount = chunks.length

      // Apply filtering to the audiences
      const userAudienceIds = await odp.filterAudiences(odpId, chunks[pageNumber])
      audiences = allAudiences.filter(a => userAudienceIds.includes(a.id))
    }

    // Fetch the profile if needed
    const fetchedProfile = odp && fetchProfileCard && odpId ? await odp.getProfileInfo(odpId) : undefined
    // A profile without any identifying field only holds anonymous activity
    const profile = fetchedProfile && isIdentified(fetchedProfile) ? fetchedProfile : undefined
    const profileState: ProfileState = !odpId ? 'anonymous' : fetchedProfile ? (profile ? 'identified' : 'anonymous') : 'unknown'

    // Determine topics if needed
    let topics: string[] = []
    if (fetchContentTopics && crId) {
      const contentRecs = new ContentRecs.Client();
      topics = await contentRecs.getContentTopics(crId)
    }

    const responseData: ProfileApiResponse = {
      ids: {
        dataPlatform: odpId || NO_ID,
        frontend: frontendId || NO_ID,
        contentIntelligence: crId || NO_ID,
        webExperimentation: webExId || NO_ID
      },
      rts: {
        pageSize,
        pageNumber,
        audiences,
        audiencesPageCount,
        audiencesCount,
      },
      profile: profile ?? null,
      profileState,
      contentTopics: topics,
      duration: `${Date.now() - start}ms`
    }
    return [responseData, 200]
  }
}



export default ProfileApiService

export type ProfileState = 'identified' | 'anonymous' | 'unknown'

function isIdentified(profile: DataPlatform.Profile): boolean {
  return [profile.email, profile.name, profile.first_name, profile.last_name, profile.phone].some(v => !!v)
}

export type ProfileApiResponse = {
  ids: {
    frontend: string
    dataPlatform: string
    contentIntelligence: string
    webExperimentation: string
  },
  contentTopics: string[]
  rts: {
    audiences: { id: string, name: string }[]
    audiencesPageCount: number
    audiencesCount: number
    pageSize: number
    pageNumber: number
  }
  profile: DataPlatform.Profile | null
  /**
   * Why `profile` is, or is not, present: `identified` when it is returned,
   * `anonymous` when there is no ODP visitor ID or the profile has no
   * identifying fields, and `unknown` when ODP has no profile for the visitor ID.
   */
  profileState?: ProfileState
  duration?: string
}

function stringToInt(value: string | undefined | null, defaultValue: number) {
  try {
    const result = Number.parseInt(value ?? defaultValue.toString(), 10)
    return isNaN(result) ? defaultValue : result
  } catch {
    // Ingored on purpose
  }
  return defaultValue
}