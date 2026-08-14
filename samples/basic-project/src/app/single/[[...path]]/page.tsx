import { createClient as client } from '@remkoj/optimizely-cms-nextjs'
import { createPage } from '@remkoj/optimizely-cms-nextjs/page'
import { factory } from '@/components/factory'
import { getContentByPath } from '@/gql/functions'
import { channelId as channel } from '@/api';

// Create the page components and functions
const {
  generateMetadata,
  generateStaticParams,
  CmsPage: Page,
} = createPage(factory, { channel, getContentByPath, client })

// Configure the Next.JS route handling for the pages
export const dynamic = 'error' // Throw an error when the [[...path]] route becomes dynamic, as this will seriously hurt site performance
export const dynamicParams = true // Allow new pages to be resolved without rebuilding the site
export const revalidate = false // Keep the cache untill manually revalidated using the Webhook

// Export page & helper methods
export { generateMetadata, generateStaticParams }
export default Page
