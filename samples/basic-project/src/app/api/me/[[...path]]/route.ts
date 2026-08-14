import { createOptimizelyOneApi } from '@remkoj/optimizely-one-nextjs/api'

const handler = createOptimizelyOneApi()

export const GET = handler
export const POST = handler
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
