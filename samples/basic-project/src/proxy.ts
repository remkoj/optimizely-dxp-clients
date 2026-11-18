import { withOptimizelyOne } from '@remkoj/optimizely-one-nextjs/proxy'
import { NextResponse, type NextProxy } from 'next/server'

const baseProxy: NextProxy = () => NextResponse.next()

export const proxy = withOptimizelyOne(baseProxy)

export const config = {
  matcher: ['/single/:path*', '/multi/:path*']
}
