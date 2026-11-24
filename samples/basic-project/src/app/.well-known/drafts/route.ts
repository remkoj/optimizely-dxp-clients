import { draftMode } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { client } from '@/api'

export async function GET(request: Request) {
  // Parse query string parameters
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('path')
  const stop = searchParams.get('output') === 'json'

  // Validate access, this must be implemented differently in a 
  // production site as this example will leak the token in the
  // logs. This is just a placeholder to show that access rights
  // must be checked prior to enabling draft mode....
  const token = searchParams.get('token');
  if (!client.siteInfo.publishToken || client.siteInfo.publishToken !== token)
    return notFound();

  // Enable Draft Mode by setting the cookie
  const draft = await draftMode()
  if (!draft.isEnabled) {
    console.log('Enabling draft mode')
    draft.enable()
    if (stop) return new Response('Enabled draft mode')
  } else {
    console.log('Disabling draft mode')
    draft.disable()
    if (stop) return new Response('Disabled draft mode')
  }

  const safeUrl = new URL(slug ?? '/', 'https://example.com')
  return redirect(safeUrl.pathname)
}