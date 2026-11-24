import 'server-only'
import { DataPlatformClient, type DataPlatformCookies, type DataPlatformEvent } from './api.js'
import { parseApiKey } from './helpers.js'
import getConfig from '../../config.js'
import logger from '../../logger.js'

/**
 * Form data submitted by a server action.
 */
export type DataPlatformFormSubmission = {
  /** The email address that identifies the submitter. */
  email: string
  /** Additional profile attributes to upsert, such as `first_name`. */
  fields?: Record<string, string>
  /** The event to record; the visitor identifiers and email are added to its identifiers. */
  event: DataPlatformEvent
}

/**
 * Upserts a profile and records its form event for the current visitor.
 *
 * The visitor identifiers (`vuid`, `fs_user_id` and, when present,
 * `content_intelligence_id`) are read from the cookies and added to both the
 * profile attributes and the event identifiers, so ODP merges the submission
 * into the visitor's existing profile. The profile is updated before the event
 * is sent so downstream real-time segments can use the submitted attributes.
 * Merging in ODP is asynchronous; allow up to a minute before the data shows
 * in the visitor's profile.
 *
 * Nothing is sent, and nothing is thrown, when ODP cannot be written to: without
 * a configured ODP key the submission is skipped with a debug message (only
 * written when `NODE_ENV` is not `production` or `OPTIMIZELY_DEBUG` is enabled),
 * and with only a public key (no private key) it is skipped with a warning that
 * is always written to stderr.
 *
 * @param cookies The request cookies, from `await cookies()` in `next/headers`.
 * @param submission The email, profile fields and event to send to ODP.
 * @returns A promise that resolves after both ODP requests succeed, or when the submission was skipped.
 * @throws {DataPlatformError} When either ODP request fails; its `status` and `detail` describe the ODP response.
 */
export async function submitForm(cookies: DataPlatformCookies, { email, fields, event }: DataPlatformFormSubmission): Promise<void> {
  const [trackerId, privateKey] = parseApiKey(getConfig().OdpApiKey || '')
  if (!trackerId) {
    logger.debug('[Optimizely Data Platform]: Skipping the form submission, ODP is not configured (no OPTIMIZELY_DATAPLATFORM_ID)')
    return
  }
  if (!privateKey) {
    console.warn('[Optimizely Data Platform]: Skipping the form submission, OPTIMIZELY_DATAPLATFORM_ID contains only a public key and ODP writes require a private key')
    return
  }
  const client = new DataPlatformClient()
  await client.identify({ email, attributes: fields }, cookies)
  await client.sendEvent({ ...event, identifiers: { ...event.identifiers, email } }, cookies)
}
