'use client'

type InlineScriptProps = {
  id: string
  html: string
}

/**
 * Renders an inline script that executes during server HTML parsing but is
 * inert when React renders it again in the browser.
 *
 * @param props The script element identifier and inline JavaScript.
 * @returns An inline script element with hydration-safe client behavior.
 */
export function InlineScript({ id, html }: InlineScriptProps) {
  return (
    <script
      id={id}
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
