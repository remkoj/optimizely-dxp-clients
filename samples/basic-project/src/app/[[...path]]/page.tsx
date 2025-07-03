import {
  createClient,
  AuthMode,
  type IOptiGraphClient,
} from '@remkoj/optimizely-graph-client'
import { createPage } from '@remkoj/optimizely-cms-nextjs/page'
import { factory } from '@/components/factory'
import { draftMode } from 'next/headers'
import { getContentByPath } from '@/gql/functions'

// Create the page components and functions
const {
  generateMetadata,
  generateStaticParams,
  CmsPage: Page,
} = createPage(factory, {
  //getContentByPath,
  /**
   * The factory to use to create the GraphQL Client to fetch data from Optimizely
   * CMS.
   *
   * @returns     The Optimizely Graph Client
   */
  client(token?: string, mode?: 'request' | 'metadata'): IOptiGraphClient {
    // Create the actual graph client
    const client = createClient(undefined, token, {
      nextJsFetchDirectives: true,
    })
    //if (client.debug)
    console.log('⚪ [Sample Site] Created new Optimizely Graph client')

    // Check if we're in request mode, if not the "draft mode" check will fail
    if (mode == 'request') {
      const { isEnabled } = draftMode()

      // When draftmode is enabled, switch to common drafts
      if (isEnabled) {
        client.updateAuthentication(AuthMode.HMAC)
        client.enablePreview()
        //if (client.debug)
        console.log('⚪ [Sample Site] Switching to common drafts')
      }
    }
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
