import * as Helpers from './helpers'
import getConfig from '../../config'
import type { ReadonlyRequestCookies } from '../types'

/**
 * The request cookies used to read the visitor identifiers for server-side writes.
 */
export type DataPlatformCookies = Awaited<ReadonlyRequestCookies>

/**
 * Configuration options for {@link DataPlatformClient}.
 */
export type DataPlatformClientOptions = {
  /** ODP private API key, or a public/private key pair. */
  privateApiKey: string,
  /** ODP API base URL. */
  endpoint: string,
  /** Maximum size used when querying audience membership. */
  membershipTestChunkSize: number
}

/**
 * Audience identifiers and descriptions returned by ODP.
 */
export type DataPlatformAudienceList = { id: string, name: string }[]

/**
 * An event payload accepted by the ODP server-side event API.
 */
export type DataPlatformEvent = {
  /** Event type, such as `form` or `prospect`. */
  type: string
  /** Optional action associated with the event. */
  action?: string
  /**
   * Additional customer identifiers, such as `email`. The visitor identifiers
   * (`vuid`, `fs_user_id` and `content_intelligence_id`) are always added from
   * the request cookies and take precedence.
   */
  identifiers?: Record<string, string>
  /** Additional event attributes. */
  data?: Record<string, string>
}

/**
 * A high-level server client for Optimizely Data Platform.
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

  /**
   * Creates a Data Platform client from environment configuration and overrides.
   *
   * @param options Optional API key, endpoint, and audience-query overrides.
   */
  public constructor(options?: Partial<DataPlatformClientOptions>)
  {
    const { OdpService: endpoint, OdpApiKey: privateApiKey, OdpAudienceBatchSize: membershipTestChunkSize, OptimizelyDebug: debug } = getConfig()
    const defaults : DataPlatformClientOptions = { endpoint, privateApiKey: privateApiKey || "", membershipTestChunkSize }
    this.config = { ...defaults, ...options };
    [ this._publicKey, this._privateKey ] = Helpers.parseApiKey(this.config.privateApiKey)
    if (!this._publicKey)
      throw new DataPlatformError("The Optimizely Data Platform configuration doesn't contain a tracker id", this.trackerId)
    if (!this._privateKey && debug)
      console.warn('[Optimizely Data Platform]: No Private Key provided, authorized queries are not available')
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
    const listResponse = await this.privateQuery(listAudiencesQuery).catch(() => undefined)
    if (!listResponse?.ok) {
      if (throwOnError)
        throw new DataPlatformError("Error listing all audiences within ODP", this.trackerId)
      console.error("Error listing all audiences within ODP")
      return []
    }
    const listData = (await listResponse.json()) as { data: { audiences: { edges: { node: { name: string, description: string }}[]}} }
    return (listData?.data?.audiences?.edges?.map(e => { return { id: e.node.name, name: e.node.description } }) ?? [])
  }

  /**
   * Returns which of the supplied audiences contain the visitor.
   *
   * @param vuid ODP visitor ID.
   * @param audiences Audience identifiers to check.
   * @returns The matching audience identifiers.
   */
  public async filterAudiences(vuid: string, audiences: string[]) : Promise<string[]>
  {
    const query = 'query GetMyAudiences($vuid: String!, $audiences: [String!]!) { customer(vuid: $vuid) { audiences(subset: $audiences) { edges { node { name } } } } }'
        
    const variables = {
      vuid,
      audiences
    }

    type GQLResponse = { data: { customer: { audiences: { edges: { node: { name: string }}[]} }} }

    const response = await this.privateQuery(query,variables).catch(() => undefined)
    if (response?.ok)
      return (response.json() as Promise<GQLResponse>)
        .then(ds => (ds?.data?.customer?.audiences?.edges ?? []).map(e => e.node.name))
        
    throw new DataPlatformError(`Error response from Optimizely Data Platform: ${ response?.status }: ${ response?.statusText }`, this.trackerId)
  }

  /**
   * Retrieves recent search terms for a visitor, newest first.
   *
   * @param vuid ODP visitor ID.
   * @returns Search terms recorded in navigation events.
   */
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
    const responseData = await this.privateQuery(query, variables).then(response => response.json() as Promise<{ data: { events: { edges: { node: { search_term: string }}[]}}, errors: never }>).catch(() => { return { errors: [{message: "Uncaught error"}]} as { data: never, errors: Array<{message:string}>}} )
    if (responseData.errors)
    {
      console.error("Error while fetching latest search terms, please check your keys")
      console.error(responseData.errors.map(e => e.message).join('; '))
      return []
    }
        
    const terms = (responseData.data?.events?.edges?.map(e => e.node.search_term ) ?? []) as string[]

    return terms
  }

  /**
   * Retrieves profile details for a visitor.
   *
   * The profile is resolved with `customer(vuid:)`, which matches every VUID
   * known to the profile through its identifiers, not only the most recent one.
   *
   * @param vuid ODP visitor ID.
   * @returns The matching profile, or `undefined` when ODP does not know the visitor or the request failed.
   */
  public async getProfileInfo(vuid: string) : Promise<DataPlatformProfile | undefined>
  {
    const query = `query getProfileInfo($vuid: String!) {
  customer(vuid: $vuid) {
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
}`
    const responseData = await this.privateQuery(query, { vuid }).then(response => response.json() as Promise<DataPlatformProfileResponse>).catch(() => { return { errors: [{message: "Uncaught error"}]} as DataPlatformProfileResponse} )
    if (responseData?.errors)
    {
      // ODP responds with an error for a VUID that isn't known, which means there is no profile
      const unknownVisitor = responseData.errors.some(e => (e.extensions?.classification ?? e.message ?? '').includes('INVALID_IDENTIFIER'))
      if (!unknownVisitor)
      {
        console.error("Error while fetching profile information, please check your keys")
        console.error(responseData.errors.map((e : { message: string }) => e.message).join('; '))
      }
      return undefined
    }

    return responseData?.data?.customer ?? undefined
  }

  protected async privateQuery(graphQuery: string, variables?: Record<string,unknown>) : Promise<Response>
  {
    if (!this.privateKey)
      throw new Error("Private key not set")
    return fetch(new URL('/v3/graphql', this.config.endpoint), {
      method: "POST",
      body: JSON.stringify({ query: graphQuery, variables }),
      headers: {
        "content-type": "application/json",
        "x-api-key": this.privateKey
      }
    })
  }

  /**
   * Sends a public-key GraphQL query to ODP.
   *
   * @param graphQuery GraphQL query document.
   * @param variables Optional GraphQL variables.
   * @returns The ODP HTTP response.
   */
  public async query(graphQuery: string, variables?: Record<string,unknown>) : Promise<Response>
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

  /**
   * Creates or updates a customer profile in ODP.
   *
   * The visitor identifiers from the request cookies (`vuid`, `fs_user_id` and
   * `content_intelligence_id`) are always added to the attributes, so ODP merges
   * the profile with the visitor's existing profile. When the cookies hold no
   * identifiers, the profile is written by its own identifiers (such as `email`)
   * alone and a warning is logged.
   *
   * @param attributes Profile fields, including at least one ODP identifier such as `email`.
   * @param cookies The request cookies of the visitor, as returned by `cookies()` from `next/headers`.
   * @returns The successful ODP HTTP response.
   * @throws {DataPlatformError} When there are no visitor identifiers and the attributes hold no `email`.
   */
  public async upsertProfile(attributes: Record<string, string>, cookies: DataPlatformCookies): Promise<Response>
  {
    const identifiers = this.resolveVisitorIdentifiers(cookies, attributes.email)
    return this.privatePost('/v3/profiles', [{ attributes: { ...attributes, ...identifiers } }])
  }

  /**
   * Records an event in ODP.
   *
   * The visitor identifiers from the request cookies (`vuid`, `fs_user_id` and
   * `content_intelligence_id`) are always added to the event identifiers. When
   * the cookies hold no identifiers, the event is written with the supplied
   * identifiers alone and a warning is logged.
   *
   * @param event Event payload with the data to submit and optional extra identifiers such as `email`.
   * @param cookies The request cookies of the visitor, as returned by `cookies()` from `next/headers`.
   * @returns The successful ODP HTTP response.
   * @throws {DataPlatformError} When there are no visitor identifiers and the event holds no identifiers.
   */
  public async sendEvent(event: DataPlatformEvent, cookies: DataPlatformCookies): Promise<Response>
  {
    const identifiers = this.resolveVisitorIdentifiers(cookies, Object.keys(event.identifiers ?? {}).length > 0)
    return this.privatePost('/v3/events', [{ ...event, identifiers: { ...event.identifiers, ...identifiers } }])
  }

  /**
   * Identifies a visitor by email address, and links the email to the visitor's
   * existing profile through the visitor identifiers from the request cookies.
   *
   * @param profile The email address and any additional profile attributes.
   * @param cookies The request cookies of the visitor, as returned by `cookies()` from `next/headers`.
   * @returns The successful ODP HTTP response.
   */
  public async identify(profile: { email: string, attributes?: Record<string, string> }, cookies: DataPlatformCookies): Promise<Response>
  {
    return this.upsertProfile({ ...profile.attributes, email: profile.email }, cookies)
  }

  private resolveVisitorIdentifiers(cookies: DataPlatformCookies, hasOwnIdentifier: string | boolean | undefined): Record<string, string>
  {
    const identifiers = Helpers.getVisitorIdentifiers(cookies) as Record<string, string>
    if (!identifiers.vuid || !identifiers.fs_user_id)
    {
      const missing = ['vuid', 'fs_user_id'].filter(id => !identifiers[id]).join(' and ')
      if (Object.keys(identifiers).length == 0 && !hasOwnIdentifier)
        throw new DataPlatformError(`Cannot write to ODP without a visitor identifier: no ${ missing } cookie and no other identifier`, this.trackerId)
      console.warn(`[Optimizely Data Platform]: The visitor cookies for ${ missing } are missing, ODP will not be able to merge this write into the visitor's profile`)
    }
    return identifiers
  }

  private async privatePost(path: string, payload: unknown): Promise<Response>
  {
    if (!this.privateKey)
      throw new DataPlatformError('Private key not set', this.trackerId)

    const response = await fetch(new URL(path, this.config.endpoint), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.privateKey
      },
      body: JSON.stringify(payload),
      cache: 'no-store'
    })
    if (!response.ok)
      throw new DataPlatformError(`ODP ${path} request failed with ${response.status} ${response.statusText}`, this.trackerId)
    return response
  }
}

/**
 * Error raised for Data Platform configuration and API failures.
 */
export class DataPlatformError extends Error
{
  private _trackerId ?: string

  /** The public tracker ID associated with the failed request, if available. */
  public get trackerId(): string
  {
    return this._trackerId ?? ''
  }

  /**
   * Creates an error associated with a Data Platform tracker.
   *
   * @param message Error description.
   * @param trackerId Optional public tracker ID.
   * @param options Native Error options, such as a cause.
   */
  public constructor(message?: string, trackerId?: string, options?: ErrorOptions)
  {
    super(message, options)
    this._trackerId = trackerId
  }
}

export default DataPlatformClient

type DataPlatformProfileResponse = ({
  data: {
    customer: DataPlatformProfile | null
  },
  errors: never
} | {
  data: never
  errors: {
    message: string
    locations: { line: number, column: number }[]
    extensions?: { classification?: string }
  }[]
})

/**
 * Profile fields returned by the ODP customer query.
 */
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
  } | null
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
  } | null
  phone: string | null
  timezone: string | null
  image_url: string | null
}