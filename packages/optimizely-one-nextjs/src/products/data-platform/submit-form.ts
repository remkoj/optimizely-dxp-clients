import 'server-only'
import { DataPlatformClient, type DataPlatformCookies, type DataPlatformEvent } from './api.js'

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
 * @param cookies The request cookies, from `await cookies()` in `next/headers`.
 * @param submission The email, profile fields and event to send to ODP.
 * @returns A promise that resolves after both ODP requests succeed.
 * @throws {DataPlatformError} When ODP is not configured with a private key.
 * @throws {DataPlatformError} When either ODP request fails.
 */
export async function submitForm(cookies: DataPlatformCookies, { email, fields, event }: DataPlatformFormSubmission): Promise<void> {
  const client = new DataPlatformClient()
  await client.identify({ email, attributes: fields }, cookies)
  await client.sendEvent({ ...event, identifiers: { ...event.identifiers, email } }, cookies)
}
