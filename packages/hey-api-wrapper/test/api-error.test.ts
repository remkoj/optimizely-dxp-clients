import { describe, expect, it } from 'vitest'
import { ApiError } from '../src/index'

function createContext(error?: unknown) {
  const request = new Request('https://cms.example.com/api/items?token=secret', {
    method: 'POST',
    headers: { Authorization: 'Bearer secret-token' }
  })
  const response = new Response('{"detail":"secret body"}', { status: 400, statusText: 'Bad Request' })
  return { error, request, response }
}

describe('ApiError', () => {
  it('stores and exposes the full, unmodified request and response', () => {
    const context = createContext({ detail: 'secret body' })
    const error = new ApiError(context)

    expect(error.request).toBe(context.request)
    expect(error.response).toBe(context.response)
    expect(error.request?.url).toBe('https://cms.example.com/api/items?token=secret')
    expect(error.request?.headers.get('Authorization')).toBe('Bearer secret-token')
  })

  it('exposes the raw error payload, status and status text', () => {
    const payload = { detail: 'secret body' }
    const error = new ApiError(createContext(payload))

    expect(error.data).toBe(payload)
    expect(error.body).toBe(payload)
    expect(error.status).toBe(400)
    expect(error.statusText).toBe('Bad Request')
  })

  it('derives the message from the response status when the error is not a string', () => {
    expect(new ApiError(createContext({ detail: 'x' })).message).toBe('Optimizely CMS API Error: 400 Bad Request')
  })

  it('falls back to defaults without a response', () => {
    const error = new ApiError({})

    expect(error.message).toBe('Optimizely CMS API Error: 500 Unknown error')
    expect(error.status).toBe(500)
    expect(error.statusText).toBe('Unknown error')
    expect(error.request).toBeUndefined()
    expect(error.response).toBeUndefined()
  })

  it('uses a plain string error as the message', () => {
    expect(new ApiError(createContext('Item not found')).message).toBe('Item not found')
  })

  it('keeps a short, clean string error verbatim', () => {
    expect(new ApiError(createContext('Plain – message, with punctuation: 100%')).message).toBe('Plain – message, with punctuation: 100%')
  })

  it('keeps the raw string error as data while sanitizing the message', () => {
    const raw = 'first line\r\nFAKE LOG ENTRY\u001b[31m'
    const error = new ApiError(createContext(raw))

    expect(error.data).toBe(raw)
    expect(error.message).not.toMatch(/\p{Cc}/u)
    expect(error.message).toContain('first line')
    expect(error.message).toContain('FAKE LOG ENTRY')
  })

  it('bounds the length of the message without altering the stored error', () => {
    const raw = 'a'.repeat(5000)
    const error = new ApiError(createContext(raw))

    expect(error.message.length).toBeLessThanOrEqual(500)
    expect(error.message.startsWith('aaaa')).toBe(true)
    expect(error.data).toBe(raw)
  })

  it('falls back to the status message when the string error has no printable text', () => {
    expect(new ApiError(createContext('\r\n\t ')).message).toBe('Optimizely CMS API Error: 400 Bad Request')
  })

  it('uses the name of the API in the derived message when provided', () => {
    expect(new ApiError(createContext({ detail: 'x' }), 'Graph Admin API').message).toBe('Optimizely Graph Admin API Error: 400 Bad Request')
    expect(new ApiError(createContext('\r\n\t '), 'Graph Admin API').message).toBe('Optimizely Graph Admin API Error: 400 Bad Request')
  })

  it('keeps the CMS API message when no name is provided', () => {
    expect(new ApiError(createContext({ detail: 'x' }), undefined).message).toBe('Optimizely CMS API Error: 400 Bad Request')
  })
})
