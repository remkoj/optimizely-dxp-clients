import { createDatafileHandler } from '@remkoj/optimizely-one-nextjs/feature-experimentation/server'

export const GET = createDatafileHandler()
// Static, so the datafile is retrieved and cached at build time
export const dynamic = 'force-static'
