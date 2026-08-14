import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: __dirname,
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
