import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChannelDefinition } from '../src/services/channel-repository/definition.js'
import type { ChannelDomain } from '../src/services/channel-repository/types.js'

function getPrimaryUrl(domain: Partial<ChannelDomain> & { name: string }): URL {
  const channel = new ChannelDefinition({
    id: 'channel',
    name: 'Channel',
    domains: [{ isPrimary: true, isEdit: false, ...domain }],
    locales: [],
    content: {}
  }, 'https://cms.example.com')
  return channel.getPrimaryDomain()
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('ChannelDefinition domain URLs', () => {
  it.each(['production', 'development', 'test'])('defaults to https when isSecure is not set (NODE_ENV=%s)', (nodeEnv) => {
    vi.stubEnv('NODE_ENV', nodeEnv)
    expect(getPrimaryUrl({ name: 'www.example.com' }).href).toBe('https://www.example.com/')
  })

  it.each(['localhost', 'localhost:3000', 'site.local', 'site.local:8080'])('defaults to http for the local domain %s', (name) => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(getPrimaryUrl({ name }).protocol).toBe('http:')
  })

  it('honours an explicit isSecure setting', () => {
    expect(getPrimaryUrl({ name: 'www.example.com', isSecure: true }).protocol).toBe('https:')
    expect(getPrimaryUrl({ name: 'www.example.com', isSecure: false }).protocol).toBe('http:')
  })
})
