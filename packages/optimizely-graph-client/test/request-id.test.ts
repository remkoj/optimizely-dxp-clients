import { describe, expect, it } from 'vitest'
import { extractRequestId, maskHeaders, maskSecret, REQUEST_ID_HEADERS } from '../src/client/utils.js'
import { OptiGraphRequestError } from '../src/client/errors.js'

describe('extractRequestId', () => {
  it('reads every supported header, case-insensitively', () => {
    for (const name of REQUEST_ID_HEADERS) {
      expect(extractRequestId(new Headers({ [name.toUpperCase()]: 'abc-123' }))).toBe('abc-123')
    }
  })

  it('prefers correlation-id over the other headers', () => {
    const headers = new Headers({ 'x-request-id': 'second', 'correlation-id': 'first' })
    expect(extractRequestId(headers)).toBe('first')
  })

  it('returns undefined when there is no id, an empty id or no headers', () => {
    expect(extractRequestId(new Headers({ 'content-type': 'application/json' }))).toBeUndefined()
    expect(extractRequestId(new Headers({ 'correlation-id': '' }))).toBeUndefined()
    expect(extractRequestId(undefined)).toBeUndefined()
    expect(extractRequestId(null)).toBeUndefined()
  })
})

describe('maskSecret', () => {
  it('keeps the scheme and the first four characters of a credential', () => {
    expect(maskSecret('Basic dXNlcjpwYXNzd29yZA==')).toBe('Basic dXNl***')
    expect(maskSecret('Bearer abcdefghijklmnop')).toBe('Bearer abcd***')
  })

  it('fully masks short values', () => {
    expect(maskSecret('secret')).toBe('***')
    expect(maskSecret('Basic abc')).toBe('Basic ***')
  })
})

describe('maskHeaders', () => {
  const secretValues = ['dXNlcjpwYXNzd29yZA==', 'tokentokentokentoken', 'alice', 'Editors,Admins']
  const input = {
    Authorization: 'Basic dXNlcjpwYXNzd29yZA==',
    'cg-username': 'alice',
    'cg-roles': 'Editors,Admins',
    'cg-recursive-enabled': 'true',
    'X-Client': '@RemkoJ/OptimizelyGraphClient'
  }

  it('masks credentials in plain objects and keeps other headers', () => {
    const masked = maskHeaders(input)
    const serialized = JSON.stringify(masked)
    expect(masked['Authorization']).toBe('Basic dXNl***')
    expect(masked['cg-recursive-enabled']).toBe('true')
    expect(masked['X-Client']).toBe('@RemkoJ/OptimizelyGraphClient')
    for (const value of secretValues)
      expect(serialized).not.toContain(value)
  })

  it('supports Headers instances and tuple arrays, without changing the input', () => {
    const fromHeaders = maskHeaders(new Headers({ authorization: 'Bearer tokentokentokentoken' }))
    expect(fromHeaders['authorization']).toBe('Bearer toke***')
    const fromTuples = maskHeaders([['Authorization', 'epi-single abcdefghijkl']])
    expect(fromTuples['Authorization']).toBe('epi-single abcd***')
    expect(input.Authorization).toBe('Basic dXNlcjpwYXNzd29yZA==')
  })

  it('returns an empty object when there are no headers', () => {
    expect(maskHeaders(undefined)).toEqual({})
  })
})

describe('OptiGraphRequestError', () => {
  it('carries the request id and status as primitives only', () => {
    const error = new OptiGraphRequestError('Failed', { requestId: 'abc', status: 500, operationName: 'getPage' })
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('OptiGraphRequestError')
    expect(error.message).toBe('Failed [request-id: abc]')
    expect(error.requestId).toBe('abc')
    expect(error.status).toBe(500)
    expect(error.operationName).toBe('getPage')
    expect(error.cause).toBeUndefined()
  })

  it('does not extend the message without a request id', () => {
    expect(new OptiGraphRequestError('Failed').message).toBe('Failed')
  })
})
