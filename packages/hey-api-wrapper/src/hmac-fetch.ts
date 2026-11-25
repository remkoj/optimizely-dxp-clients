import Base64 from 'crypto-js/enc-base64.js'
import hmacSHA256 from 'crypto-js/hmac-sha256.js'
import md5 from 'crypto-js/md5.js'

/** The signature of the fetch implementation used by the clients */
export type FetchAPI = typeof fetch

/**
 * Create a fetch implementation that signs every request for the Optimizely
 * Graph Admin API with an `epi-hmac` Authorization header. The signature covers
 * the App Key, method, path and query, a timestamp, a nonce and the MD5 hash of
 * the request body, which is read in full for `Request` inputs.
 *
 * @param   appKey      The Optimizely Graph App Key
 * @param   secret      The Optimizely Graph Secret, base64 encoded
 * @returns A fetch implementation that adds the signature to each request
 */
export function createHmacFetch(appKey: string, secret: string) : FetchAPI
{
  function isRequest(toTest: any) : toTest is Request
  {
    if (typeof(toTest) != 'object' || toTest == null)
      return false
    return (toTest as Request).url ? true : false
  }

  return async function newFetch(input: Parameters<FetchAPI>[0] | URL, init?: Parameters<FetchAPI>[1]) : ReturnType<FetchAPI>
  {
    //#region HMAC Signature
    const url = new URL(isRequest(input) ? input.url : input.toString())
    const method = (isRequest(input) ? input.method : init?.method) ?? 'get'
    const secretBytes = Base64.parse(secret)
    const target = url.pathname + url.search
    const timestamp = new Date().getTime()
    const nonce = Math.random().toString(36).substring(7)
    const body = isRequest(input) ? (input.body ? await input.clone().text() : "") : String(init?.body ?? '')
    const body_b64 = md5(String(body || "")).toString(Base64)
    const message = appKey + method + target + timestamp + nonce + body_b64
    const hmac = hmacSHA256(message, secretBytes)
    const signature = Base64.stringify(hmac)
    const authHeaderValue = `epi-hmac ${ appKey }:${ timestamp }:${ nonce }:${ signature }`
    //#endregion

    const newRequest = (isRequest(input) ? input.clone() : new Request(url, init)) as Request
    newRequest.headers.set('authorization', authHeaderValue)

    return fetch(newRequest) as ReturnType<FetchAPI>
  }
}
