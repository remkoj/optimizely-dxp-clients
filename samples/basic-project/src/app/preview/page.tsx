import { createEditPageComponent } from '@remkoj/optimizely-cms-nextjs/preview'
import { getContentById } from '@/gql/functions'
import { factory } from '@/components/factory'
import { createClient } from '@remkoj/optimizely-graph-client'

export default createEditPageComponent(factory, {
  loader: getContentById,
  clientFactory: (token?: string) => {
    const client = createClient(undefined, token, {
      nextJsFetchDirectives: true,
      cache: false,
      queryCache: false,
    })
    return client
  },
  refreshTimeout: 500, // Enable this line when you have issues with the preview not updating at all
})

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0
export const runtime = 'nodejs'
