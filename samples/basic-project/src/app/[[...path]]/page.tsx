import 'server-only'
import { createClient, AuthMode } from '@remkoj/optimizely-graph-client'
import { createPage } from '@remkoj/optimizely-cms-nextjs/page'
import { factory } from '@/components/factory'

// Create the page components and functions
const {
  generateMetadata,
  generateStaticParams,
  CmsPage: Page,
} = createPage(factory, {
  /**
   * The factory to use to create the GraphQL Client to fetch data from Optimizely
   * CMS.
   *
   * @returns     The Optimizely Graph Client
   */
  client: () => {
    const client = createClient()
    client.updateAuthentication(AuthMode.HMAC)
    client.enablePreview()
    if (client.debug)
      console.log('⚪ [Sample Site] Created new Optimizely Graph client')
    return client
  },
})

// Configure the Next.JS route handling for the pages
export const dynamic = 'error' // Throw an error when the [[...path]] route becomes dynamic, as this will seriously hurt site performance
export const dynamicParams = true // Allow new pages to be resolved without rebuilding the site
export const revalidate = false // Keep the cache untill manually revalidated using the Webhook

// Export page & helper methods
export { generateMetadata, generateStaticParams }
export default Page
