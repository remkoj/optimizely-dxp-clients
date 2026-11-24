import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Base64 from 'crypto-js/enc-base64.js'
import hmacSHA256 from 'crypto-js/hmac-sha256.js'
import md5 from 'crypto-js/md5.js'
import { createHmacFetch } from '../src/hmac-fetch.js'

const APP_KEY = 'app-key'
const SECRET = Buffer.from('graph-secret').toString('base64')

let sent: Request | undefined

beforeEach(() => {
  sent = undefined
  vi.stubGlobal('fetch', vi.fn(async (input: Request) => {
    sent = input
    return new Response('{}')
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function verify(request: Request, method: string, target: string, body: string) {
  const header = request.headers.get('authorization') ?? ''
  const match = /^epi-hmac ([^:]+):(\d+):([^:]+):(.+)$/.exec(header)
  expect(match).not.toBeNull()
  const [, key, timestamp, nonce, signature] = match as RegExpExecArray
  expect(key).toBe(APP_KEY)
  const message = key + method + target + timestamp + nonce + md5(body).toString(Base64)
  expect(signature).toBe(Base64.stringify(hmacSHA256(message, Base64.parse(SECRET))))
}

describe('createHmacFetch', () => {
  it('signs a request that is created from a URL and init', async () => {
    await createHmacFetch(APP_KEY, SECRET)('https://graph.example.com/a/b?x=1', { method: 'POST', body: '{"a":1}' })
    expect(sent).toBeDefined()
    verify(sent as Request, 'POST', '/a/b?x=1', '{"a":1}')
  })

  it('signs a Request object with the complete body, including multi-chunk bodies', async () => {
    const encoder = new TextEncoder()
    const chunks = ['{"first":"', 'second-chunk', '"}']
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        chunks.forEach(chunk => controller.enqueue(encoder.encode(chunk)))
        controller.close()
      }
    })
    const request = new Request('https://graph.example.com/api/webhooks', {
      method: 'POST',
      body: stream,
      duplex: 'half'
    } as RequestInit)

    await createHmacFetch(APP_KEY, SECRET)(request)

    verify(sent as Request, 'POST', '/api/webhooks', chunks.join(''))
    expect(await (sent as Request).text()).toBe(chunks.join(''))
  })

  it('signs a Request object without a body', async () => {
    await createHmacFetch(APP_KEY, SECRET)(new Request('https://graph.example.com/api/webhooks'))
    verify(sent as Request, 'GET', '/api/webhooks', '')
  })

  it('does not write to the console', async () => {
    const spies = [vi.spyOn(console, 'log'), vi.spyOn(console, 'info'), vi.spyOn(console, 'warn'), vi.spyOn(console, 'error')]
    await createHmacFetch(APP_KEY, SECRET)(new Request('https://graph.example.com/x', { method: 'POST', body: 'abc' }))
    spies.forEach(spy => expect(spy).not.toHaveBeenCalled())
  })
})
