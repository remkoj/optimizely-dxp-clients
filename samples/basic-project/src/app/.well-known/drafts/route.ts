import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  // Parse query string parameters
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('path')

  const stop = searchParams.get('output') === 'json'


  // Enable Draft Mode by setting the cookie
  const draft = draftMode()
  if (!draft.isEnabled) {
    console.log("Enabling draft mode")
    draft.enable()
    if (stop) return new Response("Enabled draft mode")
  } else {
    console.log("Disabling draft mode")
    draft.disable()
    if (stop) return new Response("Disabled draft mode")
  }

  const safeUrl = new URL(slug ?? '/', 'https://example.com')
  return redirect(safeUrl.pathname)
}