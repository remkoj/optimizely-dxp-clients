import * as EnvTools from '../../utils/env'
import * as Helpers from './helpers'
import EnvVars from '../../env-vars'

export type DataPlatformClientOptions = {
    privateApiKey: string,
    endpoint: string,
    membershipTestChunkSize: number
}

export type DataPlatformAudienceList = { id: string, name: string }[]

/**
 * A high level client for the Optimizely Data Platform, providing direct
 * access to some of it's functionality. For advanced capabilities please
 * connect directly to the GraphQL endpoint.
 */
export class DataPlatformClient 
{
    protected readonly config : Readonly<DataPlatformClientOptions>
    private readonly _privateKey : string | null
    private readonly _publicKey : string

    protected get privateKey(): string
    {
        return this._privateKey || ""
    }

    public get trackerId(): string
    {
        return this._publicKey
    }

    public constructor(options?: Partial<DataPlatformClientOptions>)
    {
        const defaults : DataPlatformClientOptions = {
            endpoint: EnvTools.readValue(EnvVars.OdpService, "https://api.zaius.com/"),
            privateApiKey: EnvTools.readValue(EnvVars.OdpApiKey, ""),
            membershipTestChunkSize: 25
        }
        this.config = { ...defaults, ...options };
        [ this._publicKey, this._privateKey ] = Helpers.parseApiKey(this.config.privateApiKey)
        if (!this._publicKey)
            throw new DataPlatformError("The Optimizely Data Platform configuration doesn't contain a tracker id", this.trackerId)
        if (!this._privateKey)
            throw new DataPlatformError("The Optimizely Data Platform configuration doesn't contain private key information", this.trackerId)
    }

    /**
     * Retrieve a list of all audiences available within the  ODP Instance
     * 
     * @param       throwOnError    Set to true when an error needs to be 
     *                              thrown on an network error (instead of
     *                              returning an empty list)
     * @returns     The list of all audiences
     */
    public async getAllAudiences(throwOnError: boolean = false) : Promise<DataPlatformAudienceList>
    {
        const listAudiencesQuery = 'query GetAllAudiences { audiences { edges { node { name, description } } } }'
        const listResponse = await this.privateQuery(listAudiencesQuery)
        if (!listResponse.ok) {
            if (throwOnError)
                throw new DataPlatformError("Error listing all audiences within ODP", this.trackerId)
            console.error("Error listing all audiences within ODP")
            return []
        }
        const listData = (await listResponse.json()) as { data: { audiences: { edges: { node: { name: string, description: string }}[]}} }
        return (listData?.data?.audiences?.edges?.map(e => { return { id: e.node.name, name: e.node.description } }) ?? [])
    }

    public async filterAudiences(vuid: string, audiences: string[]) : Promise<string[]>
    {
        const query = 'query GetMyAudiences($vuid: String!, $audiences: [String!]!) { customer(vuid: $vuid) { audiences(subset: $audiences) { edges { node { name } } } } }'
        
        const variables = {
            vuid,
            audiences
        }

        type GQLResponse = { data: { customer: { audiences: { edges: { node: { name: string }}[]} }} }

        const response = await this.privateQuery(query,variables)
        if (response.ok)
            return (response.json() as Promise<GQLResponse>)
            .then(ds => (ds?.data?.customer?.audiences?.edges ?? []).map(e => e.node.name))
        
        throw new DataPlatformError(`Error response from Optimizely Data Platform: ${ response.status }: ${ response.statusText }`, this.trackerId)
    }

    public async getLastSearchTerms(vuid: string) : Promise<string[]>
    {   
        const query = `query LastSearchTerms ($vuid:String!) {
            events(vuid: $vuid, filter: "event_type='navigation'", order: {field: ts, direction: DESC}) {
                edges {
                    node {
                        search_term
                    }
                }
            }
        }`
        const variables = { vuid }
        const responseData = await (await this.privateQuery(query, variables)).json()
        if (responseData.errors)
        {
            console.error("Error while fetching latest search terms, please check your keys")
            console.error(responseData.errors.map((e : { message: string }) => e.message).join('; '))
            return []
        }
        
        const terms = (responseData.data?.events?.edges?.map((e: { node: { search_term: string }}) => e.node.search_term ) ?? []) as string[]

        return terms
    }

    public async getProfileInfo(vuid: string) : Promise<DataPlatformProfile | undefined>
    {
        const query = `query getProfileInfo($filter: String!) {
  customers(filter: $filter) {
    edges {
      node {
        name
        first_name
        last_name
        city
        country
        dob_day
        dob_month
        dob_year
        email
        observations {
          order_count
          discount_usage
          session_count
          total_revenue
          acquisition_source
          computed_age_years
          days_until_birthday
        }
        state
        street1
        street2
        zip
        insights {
          order_likelihood
          ttno_days
          winback_type
          winback_zone
          engagement_rank
          probability_alive
        }
        phone
        timezone
        image_url
      }
    }
  }
}`
        const variables = { filter: `vuid='${ vuid }'` }
        const responseData = await (await this.privateQuery(query, variables)).json() as DataPlatformProfileResponse
        if (responseData.errors)
        {
            console.error("Error while fetching latest search terms, please check your keys")
            console.error(responseData.errors.map((e : { message: string }) => e.message).join('; '))
            return undefined
        }

        const profiles = responseData.data.customers.edges.map(customer => customer.node)
        if (profiles.length == 1)
            return profiles.at(0)
        return undefined
    }

    protected async privateQuery(graphQuery: string, variables?: Record<string,any>) : Promise<Response>
    {
        return fetch(new URL('/v3/graphql', this.config.endpoint), {
            method: "POST",
            body: JSON.stringify({ query: graphQuery, variables }),
            headers: {
                "content-type": "application/json",
                "x-api-key": this.privateKey
            }
        })
    }

    public async query(graphQuery: string, variables?: Record<string,any>) : Promise<Response>
    {
        return fetch(new URL('/v3/graphql', this.config.endpoint), {
            method: "POST",
            body: JSON.stringify({ query: graphQuery, variables }),
            headers: {
                "content-type": "application/json",
                "x-api-key": this.trackerId
            }
        })
    }
}

export class DataPlatformError extends Error
{
    private _trackerId ?: string

    public get trackerId(): string
    {
        return this._trackerId ?? ''
    }

    public constructor(message?: string, trackerId?: string, options?: ErrorOptions)
    {
        super(message, options)
        this._trackerId = trackerId
    }
}

export default DataPlatformClient

type DataPlatformProfileResponse = ({
    data: {
        customers: {
            edges: {
                node: DataPlatformProfile
            }[]
        }
    },
    errors: never
} | {
    data: never
    errors: {
        message: string
        locations: { line: number, column: number }[]
        extensions: { classification: string }
    }[]
})

export type DataPlatformProfile = {
    name: string | null
    first_name: string | null
    last_name: string | null
    city: string | null
    country: string | null
    dob_day: number | null
    dob_month: number | null
    dob_year: number | null
    email: string | null
    observations: {
        order_count: string | null
        discount_usage: string | null
        session_count: string | null
        total_revenue: string | null
        acquisition_source: string | null
        computed_age_years: string | null
        days_until_birthday: string | null
    }
    state: string | null
    street1: string | null
    street2: string | null
    zip: string | null
    insights: {
        order_likelihood: string | null
        ttno_days: string | null
        winback_type: string | null
        winback_zone: string | null
        engagement_rank: number | null
        probability_alive: number | null
    }
    phone: string | null
    timezone: string | null
    image_url: string | null
}