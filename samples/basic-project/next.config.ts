import type { NextConfig } from 'next'
import { buildOptimizelySecurityHeaders } from '@remkoj/optimizely-one-nextjs/security'
import { baseSources } from './src/security'

const isDevelopment = process.env.NODE_ENV === 'development'

// The static policy, identical for every request. The Web Experimentation
// visual editor sources are omitted here and added per request in proxy.ts.
const securityHeaders = buildOptimizelySecurityHeaders(baseSources(isDevelopment), { webExVeActive: false })

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: __dirname,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: Object.entries(securityHeaders).map(([key, value]) => ({ key, value }))
      }
    ]
  },
  images: {
    remotePatterns: [
      {
        hostname: '*.cms.optimizely.com'
      }
    ]
  },
  experimental: {
    swcPlugins: [
      [
        '@swc-contrib/plugin-graphql-codegen-client-preset',
        { artifactDirectory: './src/gql', gqlTagName: 'graphql' }
      ]
    ]
  }
}

export default nextConfig
