import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  // Parse query string parameters
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('path')


  // Enable Draft Mode by setting the cookie
  const draft = draftMode()
  if (!draft.isEnabled) {
    console.log("Enabling draft mode")
    draft.enable()
  } else {
    console.log("Disabling draft mode")
    draft.disable()
  }

  const safeUrl = new URL(slug ?? '/', 'https://example.com')
  return redirect(safeUrl.pathname)
}