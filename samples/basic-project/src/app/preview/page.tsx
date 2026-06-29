import { createEditPageComponent } from '@remkoj/optimizely-cms-nextjs/preview'
import { createAuthorizedClient as clientFactory } from '@remkoj/optimizely-cms-nextjs'
import { getContentById as loader } from '@/gql/functions'
import { factory } from '@/components/factory'

export default createEditPageComponent(factory, {
  loader,
  clientFactory,
  refreshTimeout: 500, // Enable this line when you have issues with the preview not updating at all
})

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0
export const runtime = 'nodejs'
