# @remkoj/optimizely-one-nextjs — usage

Optimizely One integration for Next.js — connects Optimizely Data Platform (ODP),
Content Recommendations, Web Experimentation, and Feature Experimentation.

## Install

```bash
npm install @remkoj/optimizely-one-nextjs
```

Requires Next.js `^16`, React `^19`, and Node `>=24.0.0 <25.0.0`. The Node
upper bound follows the current workspace support and validation range.
The gadget is built on Optimizely Axiom (`@optiaxiom/react`) and injects its own
styles; no stylesheet import is required. It renders as a floating `position:
fixed` "DXP" button in the bottom-right corner.

**Gadget visibility.** The server `OptimizelyOneGadget` (and `<OptimizelyOne>`) only
includes the client gadget when `OPTIMIZELY_ONE_HELPER` is true; otherwise the
client component is never part of the page. Once included, the gadget stays hidden
in the browser until an Optimizely test cookie (`optly_<domain name>_test`, any
value; see the Optimizely Web Experimentation "test cookie" docs) is present, and
hides again when it is removed. This is checked fully client side, using Cookie
Store `change` events where supported and polling every 500ms otherwise. The
client-entry `OptimizelyOneGadget` does not read the environment; only render it
when your own gating allows it.

### Site styles must use a CSS layer

Axiom's styles live in the `optiaxiom` CSS layer, and any **unlayered** CSS
beats layered CSS regardless of specificity. When implementing this package in
a site, put **all** custom site styles (global resets, element selectors such as
`button`, `a`, `svg`, `h1`–`h6`, `p`, and utility styles) inside a named
`@layer`, and declare the layer order so `optiaxiom` comes last, so site styles
cannot override the gadget:

```css
@layer site, optiaxiom;

@layer site {
  button { /* ... */ }
  a { /* ... */ }
}
```

With Tailwind CSS v4 (whose `theme`, `base`, `components` and `utilities` are
already layers), declare it as
`@layer theme, base, components, utilities, optiaxiom;`. Never add unlayered
element or wildcard selectors to the site stylesheet.

As a safety net, the gadget prepends a `@layer <site layers>, optiaxiom;`
statement at mount so `optiaxiom` wins over the layers that exist in the page
(otherwise e.g. Tailwind's preflight resets the gadget's padding and rounding
when Axiom's CSS loads first). Declaring the order in the site stylesheet is
still the recommended setup.

## Required Next.js wiring

- Add `app/api/me/[[...path]]/route.ts` with `createOptimizelyOneApi()` exported
  as both `GET` and `POST`. The gadget, client products, and script proxy use
  this catch-all API route.
- Next.js 16 defaults route handlers to the Node.js runtime. `dynamic` and
  `fetchCache` segment options are optional and cannot be used with
  `cacheComponents`.
- `<OptimizelyOne>` and `OptimizelyOneProvider` do not render tracking
  snippets. Render `Scripts.Header` in the root layout `<head>` and
  `Scripts.Footer` near the end of `<body>`.

## Environment variables

| Variable | Description |
| --- | --- |
| `OPTIMIZELY_ONE_HELPER` | Enable/disable the Optimizely One helper and include the gadget (default: `false`) |
| `OPTIMIZELY_DATAPLATFORM_ID` | Optimizely Data Platform public or private API key |
| `OPTIMIZELY_DATAPLATFORM_ENDPOINT` | ODP service endpoint (default: `https://api.zaius.com/`); the misspelled `OPTIMIZLEY_DATAPLATFORM_ENDPOINT` is a deprecated fallback |
| `OPTIMIZELY_DATAPLATFORM_BATCH_SIZE` | Audience query batch size (default: `25`) |
| `OPTIMIZELY_CONTENTRECS_CLIENT` | Content Recommendations client ID |
| `OPTIMIZELY_CONTENTRECS_DELIVERY` | Content Recommendations delivery ID |
| `OPTIMIZELY_CONTENTRECS_DELIVERY_KEY` | Content Recommendations API key |
| `OPTIMIZELY_CONTENTRECS_DOMAIN` | Content Recommendations domain (default: `idio.co`) |
| `OPTIMIZELY_WEB_EXPERIMENTATION_PROJECT` | Web Experimentation project ID |
| `OPTIMIZELY_FRONTEND_COOKIE` | Visitor ID cookie name (default: `visitorId`) |
| `OPTIMIZELY_FX_SDKKEY` | Enables the Feature Experimentation provider and decision hooks |
| `OPTIMIZELY_FX_PROJECT` | Optional Feature Experimentation project ID for the gadget |
| `OPTIMIZELY_FX_PAT` | Optional server-only Personal Access Token; not needed for SDK decisions |
| `OPTIMIZELY_FX_PROXY` | Boolean (default `false`). Serves the datafile through the app (`/api/fx/datafile`), cached, with a webhook (`/api/fx/webhook`) to purge it |
| `OPTIMIZELY_FX_WEBHOOK_SECRET` | Optional server-only secret to verify the `X-Hub-Signature` of the datafile webhook |
| `OPTIMIZELY_DEBUG` | Set to `"1"` for debug logging |

## Subpath exports

| Import path | Contents |
| --- | --- |
| `@remkoj/optimizely-one-nextjs` | Core types and configuration |
| `@remkoj/optimizely-one-nextjs/api` | Next.js API route handlers for Optimizely One |
| `@remkoj/optimizely-one-nextjs/client` | Client-side components and hooks |
| `@remkoj/optimizely-one-nextjs/data-platform/server` | Server-only Data Platform client and form-submission helper |
| `@remkoj/optimizely-one-nextjs/feature-experimentation/server` | Server-only Feature Experimentation decisions, datafile cache and proxy route handlers |
| `@remkoj/optimizely-one-nextjs/proxy` | Next.js proxy helper |
| `@remkoj/optimizely-one-nextjs/security` | Resource hints, CSP sources, and security-header builders |
| `@remkoj/optimizely-one-nextjs/server` | Server-side utilities |

## Configuration

```typescript
import { readConfigFromEnv } from '@remkoj/optimizely-one-nextjs'

// Reads all Optimizely One config from environment variables
const config = readConfigFromEnv()
```

## API routes

Mount the Optimizely One API handler in `app/api/me/[[...path]]/route.ts`.
The catch-all segment name must match `pathParameterName` (default: `'path'`).

```typescript
import { createOptimizelyOneApi } from '@remkoj/optimizely-one-nextjs/api'

const handler = createOptimizelyOneApi()

export const GET = handler
export const POST = handler
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
```

## Visitor cookie

Wrap a Next.js proxy with `withOptimizelyOne` from `./proxy` to preserve a
visitor ID across requests. Apply it around the fully composed proxy so the
cookie is attached to its final pass-through, rewrite, or redirect response.
The cookie is only written when the request has none or it differs, so the
visitor's session stays stable. The cookie uses `OPTIMIZELY_FRONTEND_COOKIE` (default: `visitorId`) and lasts
365 days by default. For custom cookie attributes, call
`Session.addVisitorId(response, id, options)` directly. Keep the cookie
readable by browser JavaScript (`httpOnly: false`) so client-side Optimizely
products can use the same ID.

## Server-side product clients (import from `./api` or `./server`)

`DataPlatform` and `ContentRecs` are available as named exports from both `./api` and `./server`.

```typescript
import { DataPlatform, ContentRecs } from '@remkoj/optimizely-one-nextjs/api'
// or from '@remkoj/optimizely-one-nextjs/server'

// Optimizely Data Platform
if (DataPlatform.Tools.isEnabled()) {
  const vuid = DataPlatform.Tools.getVisitorID(await cookies())
  const client = new DataPlatform.Client()
  const terms = await client.getLastSearchTerms(vuid)
}

// Content Recommendations
if (ContentRecs.Tools.isEnabled()) {
  const visitorId = ContentRecs.Tools.getVisitorID(cookies())
  const client = new ContentRecs.Client()
  const topics = await client.getContentTopics(visitorId)
}
```

## Client components (import from `./client`)

```typescript
import {
  OptimizelyOneProvider,  // context provider — wrap around your root layout body
  OptimizelyOneGadget,    // debug panel; hidden until an Optimizely test cookie is present
  PageActivator,          // fires page-view events on route change
  ContentRecsDelivery,    // renders personalised content recommendations
} from '@remkoj/optimizely-one-nextjs/client'

// In root layout:
<OptimizelyOneProvider>
  <PageActivator />
  {children}
  <OptimizelyOneGadget />
</OptimizelyOneProvider>

// In a component:
<ContentRecsDelivery
  apiKey={deliveryApiKey}
  count={3}
  template={ArticleTemplate}
  className="grid grid-cols-3"
/>
```

`OptimizelyOneProvider` does not inject tracking snippets. Render `Scripts.Header`
in the root layout `<head>` and `Scripts.Footer` near the end of `<body>`.
Inline snippets execute from server-rendered HTML and stay inert during client
rendering to avoid React script-tag errors.

Feature Experimentation decisions (requires `OPTIMIZELY_FX_SDKKEY`) are available
through the same entry point; no direct `@optimizely/react-sdk` dependency is needed:

```tsx
import {
  useDecide, useDecideForKeys, useDecideAll,                // plus the *Async variants
  OptimizelyDecideOption,                                   // decide options enum
  type OptimizelyDecision, type OptimizelyUserContext,      // types
} from '@remkoj/optimizely-one-nextjs/client'

const { decision, isLoading, error } = useDecide('new-checkout')
```

Shared visitor and plain decisions, on both client and server (the visitor ID is the
frontend visitor cookie on both sides; decisions have no `userContext`, so they can
be passed to Client Components):

```tsx
// Client
import { useFeatureExperimentation } from '@remkoj/optimizely-one-nextjs/client'
const { user, ready, setAttributes, decide, decideForKeys, decideAll, getQualifiedSegments } = useFeatureExperimentation()
// `user` is undefined and `ready` false on the server and while hydrating - see "Rendering decisions without hydration errors"
const decision = await decide('new-checkout')          // optional { user, options }; waits for the visitor when called early

// Server
import { getUser, decide, decideForKeys, decideAll, getQualifiedSegments, createUser, getOrCreateUser } from '@remkoj/optimizely-one-nextjs/feature-experimentation/server'
const user = await getUser({ plan: 'pro' })            // undefined when `withOptimizelyOne` doesn't run for the route
const decision = user && await decide('new-checkout', { user })

// In the proxy, `cookies()` is not available. `getOrCreateUser` always returns a visitor: a new visitor gets
// the ID that `withOptimizelyOne` writes to the cookie, whether you run before or inside it
const proxyUser = getOrCreateUser(request, { plan: 'pro' })
// `getUser({ plan: 'pro' }, request)` also works, but only inside the proxy wrapped by `withOptimizelyOne`
// (the request holds the new visitor's cookie there); it is `undefined` for a new visitor elsewhere

// Same attributes in the browser
<OptimizelyOne fxAttributes={{ plan: 'pro' }}>...</OptimizelyOne>

// Attributes that need cookies()/headers(): keep the layout static, resolve them async in the browser
// `resolveAttributes` is a 'use server' function; its result is merged into `fxAttributes`
<OptimizelyOne fxAttributes={{ plan: 'anonymous' }} fxResolveAttributes={resolveAttributes}>...</OptimizelyOne>
// Client function instead: <ResolveFeatureExperimentationAttributes resolve={fn} /> (from /client) inside <OptimizelyOne>
```

`fxAttributes` must be static (no `cookies()`/`headers()` in the layout). Decisions use
the initial attributes until `fxResolveAttributes` resolves, then update.

With `OPTIMIZELY_FX_PROXY=true`, add two routes (the datafile route must be static so
it is cached during the build):

```typescript
// app/api/fx/datafile/route.ts
import { createDatafileHandler } from '@remkoj/optimizely-one-nextjs/feature-experimentation/server'
export const GET = createDatafileHandler()
export const dynamic = 'force-static'

// app/api/fx/webhook/route.ts
import { createWebhookHandler } from '@remkoj/optimizely-one-nextjs/feature-experimentation/server'
export const POST = createWebhookHandler()
```

Configure `<site>/api/fx/webhook` as webhook at Feature Experimentation for
`project.datafile_updated`. The browser (`<OptimizelyOne fxProxyPath="/api/fx">`) and
the server then use the cached datafile, which is only retrieved at build time and
after the webhook purged it.

### Rendering decisions without hydration errors

The visitor ID is only readable in the browser (the visitor cookie), so Client Components
that are server rendered cannot know it. `useFeatureExperimentationUser()` and
`useFeatureExperimentation()` are hydration-safe by default: on the server and during
hydration `user` is `undefined` and `ready` is `false`; right after hydration `ready` becomes
`true` and `user` is set. **Never render the visitor ID, a client-side decision, or
anything derived from them before `ready`** - server HTML and the first client render
must be identical. Don't work around it with `document.cookie`, `window`, `Math.random()`
or `Date.now()` in render, and don't use `suppressHydrationWarning` as a fix.

Choose a pattern by where the decision must be made:

| | 2. Decide in the browser | 3. Decide on the server |
| --- | --- | --- |
| API | `useFeatureExperimentation()` / `useDecide*()` in a Client Component | `getUser()` + `decide()` in a Server Component, passed as a prop |
| First HTML has the right variant | No: a fallback is rendered first | Yes |
| Page shell static | Yes, always | Only when the decision is in a `<Suspense>` island with `cacheComponents: true`; otherwise `cookies()` makes the whole route dynamic |
| Flicker / layout shift | Yes, reserve space or use a skeleton | No |
| Use for | Non-critical UI, below the fold, personalisation that may arrive late | Above the fold, SEO relevant content, layout-changing variants |

**2. Decide in the browser** - render a fallback until the decision is known:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useFeatureExperimentation, type FeatureExperimentationDecision } from '@remkoj/optimizely-one-nextjs/client'

export function Banner() {
  const { ready, decide } = useFeatureExperimentation()
  const [decision, setDecision] = useState<FeatureExperimentationDecision>()
  useEffect(() => { if (ready) decide('new-banner').then(setDecision) }, [ready, decide])
  if (!decision)
    return <div className="h-24" />                  // same markup on server and first client render
  return decision.variationKey === 'b' ? <BannerB /> : <BannerA />
}
```

- Decisions are only made in effects or event handlers, never during render.
- The fallback must be what the server renders: a skeleton, the default variant, or `null`.
  The server rendered fallback is also what is shown to visitors without JavaScript.
- `next/dynamic(..., { ssr: false })` (from a Client Component) is an alternative that skips
  server rendering of the component altogether.
- Attributes calculated from `cookies()`/`headers()` (`fxResolveAttributes`) arrive after
  `ready`; the decision updates when `decide` is called again, as `decide` changes with the attributes.

**3. Decide on the server** - the server passes a plain decision to the Client Component, so
the server HTML and the first client render match and the SDK is not needed to render:

```tsx
// Server Component, in a layout/page that stays static, inside <Suspense>
async function BannerIsland() {
  const user = await getUser(await resolveAttributes())   // reads cookies()/headers(): dynamic
  const decision = user ? await decide('new-banner', { user }) : undefined
  return <Banner variation={decision?.variationKey ?? null} />   // serializable props only
}
export default function Page() {
  return <><StaticShell /><Suspense fallback={<BannerSkeleton />}><BannerIsland /></Suspense></>
}
```

- `getUser()`, `decide*()` and anything reading `cookies()`/`headers()` must stay out of
  layouts and out of the static shell; put them in a Suspense island, a Server Function, a route
  handler, or the proxy (decide there and rewrite to a variant path).
- Pass the decision, not the SDK `userContext`, to Client Components; the Client Component renders
  from props and must not call `useFeatureExperimentation()` to re-decide during render.
- Use the same `resolveAttributes()` function for the island and for `fxResolveAttributes` so both
  sides decide for the same visitor.
- Without `cacheComponents: true` (Next 16), a `cookies()` call in a Suspense island still makes
  the whole route dynamic; Suspense then only gives streaming, not a static shell.

**Combining**: use 3 for the content that must be right in the first HTML and 2 for everything
else. When a component can be rendered by both, make 3 the source of truth by passing the
server decision as prop, and only use 2 when the prop is absent.

### ODP real-time audiences (segments)

Decisions on client and server support audiences that are backed by ODP real-time segments.
It is only active when ODP is configured in this package (`OPTIMIZELY_DATAPLATFORM_ID`, i.e.
`checkProductStatus().dataPlatform`); otherwise no ODP manager is created on either side, no
segments are fetched and `getQualifiedSegments()` returns the known `qualifiedSegments` or `[]`.
Prerequisites (outside the code): enable the ODP integration in the Feature Experimentation
project (Settings > Integrations > Data Platform Real-Time Audiences), create an audience of
type ODP and attach it to a running rule. The datafile then contains an `integrations`
section; without it all of the below is a no-op. No ODP private key is needed in the application.

- **Automatic**: with ODP configured, both the browser and the server SDK are created with an ODP manager. A
  decision for a visitor first fetches that visitor's segments from ODP (cached per
  visitor by the SDK) and then decides. `decide*()` on both sides accept `skipSegments`
  (don't fetch) and `segmentOptions` (`'IGNORE_CACHE'`, `'RESET_CACHE'`). Fetch errors are
  logged and the decision continues without segments.
- **Visitor identifier**: the SDK itself looks segments up by `fs_user_id`, which ODP only accepts when
  `fs_user_id` is a registered customer identifier (otherwise the SDK silently gets no segments).
  This package therefore looks them up with the ODP visitor ID (`vuid`, set by the ODP tracker in the
  `vuid` cookie) whenever that is known, using the ODP host and public key from the datafile (results
  cached 30 seconds per visitor; `segmentOptions` bypass or reset that cache). `getUser(attrs, source?)`
  and `getOrCreateUser(request, attrs)` add the `vuid` from the cookie; in the browser it is read from
  `document.cookie`; set `user.vuid` (or `createUser(id, attrs, segments, vuid)`) yourself otherwise.
  The browser provider does this once per visitor (waiting up to ~5s for the tracker's `vuid` cookie) and hands
  the segments to the React SDK, so `useDecision` and friends see them as well; the React SDK's own lookup is
  disabled (`skipSegments`).
  Without a `vuid` (the tracker hasn't run yet, e.g. a brand-new visitor) the SDK lookup by
  `fs_user_id` is used. Form submissions etc. must send the `vuid` to ODP, see "Server-side ODP writes".
- **Explicit**: `getQualifiedSegments(user?, segmentOptions?)` (server import and
  `useFeatureExperimentation()`) returns the segment names (`string[]`, empty when not available).
- **Known segments**: `FeatureExperimentationUser.qualifiedSegments` (also `createUser(id, attrs, segments)`)
  is used as is, without fetching. Use it to hand over server fetched segments, so the browser
  doesn't fetch them again: `<OptimizelyOne fxQualifiedSegments={segments}>` (or the `qualifiedSegments`
  prop of the provider). The value is visitor specific, so only pass it from layouts that are
  dynamic already, otherwise let the browser fetch them.

```tsx
// Server: a Suspense island, like pattern 3
const user = await getUser()
const decision = user && await decide('new-banner', { user })   // segments fetched automatically
const segments = user && await getQualifiedSegments(user)       // e.g. to pass to the browser
```

Caveats: segments lag behind ODP (usually < 30s, up to 90s), so don't use them where
instant accuracy is needed (use attributes there). On serverless hosting the ODP "identify"
event sent by the SDK is batched and may be lost when the instance is frozen; segment
lookups are not affected.

## Server utilities (import from `./server`)

```typescript
import { Scripts, OptimizelyOneGadget, EnvTools } from '@remkoj/optimizely-one-nextjs/server'

// In the root layout:
<head><Scripts.Header /></head>
<body><Scripts.Footer /></body>

// Read environment-controlled feature flags
const enabled = EnvTools.readValueAsBoolean('OPTIMIZELY_ONE_HELPER', false)
const key = EnvTools.readValue('GA_TRACKING_ID')
```

## Server-side ODP writes

Any server-side write to ODP (profile upsert, event, form submit) must include
the visitor's `vuid` AND `fs_user_id` (the visitor cookie) in the profile
attributes and event identifiers. Use `DataPlatform.Tools.getVisitorIdentifiers`;
never send only the email or only the VUID. Without both, ODP won't merge the
submission into the visitor's profile.

`DataPlatform.Client.upsertProfile`, `sendEvent` and `identify` take the request
cookies and add the identifiers (`vuid`, `fs_user_id`, and `content_intelligence_id`
from the `iv` cookie when present) automatically. Missing cookies log a warning
and the write falls back to its own identifier, such as `email`; a write without
any identifier throws. For server actions, use the server-only helper:

```typescript
'use server'

import { cookies } from 'next/headers'
import DataPlatform from '@remkoj/optimizely-one-nextjs/data-platform/server'

export async function submitContact(email: string, firstName: string) {
  await DataPlatform.submitForm(await cookies(), {
    email,
    fields: { first_name: firstName },
    event: { type: 'form', action: 'submit', data: { form_name: 'Contact' } }
  })
}
```

The helper requires an ODP private API key. Without a key at all it skips the
submission and writes a debug message (only when `NODE_ENV` is not `production`
or `OPTIMIZELY_DEBUG` is enabled); with only a public key it skips and always
writes a `console.warn`. Neither case throws. When an ODP request fails it throws
a `DataPlatformError` with a numeric `status` and a `detail` (the ODP response
body, at most 500 characters, private key and submitted values redacted; not part
of `message`, treat it as personal data). Verify after submitting:
`customer(vuid: <browser vuid>)` must return the profile holding the email
(ODP merges asynchronously; allow 15 seconds to about a minute).

## Constraints

- Server utilities (`./server`) are server-only; do not import from client components.
- Do not render `user`, the visitor ID or client-side decisions before `ready` (see "Rendering decisions without hydration errors"); this causes hydration errors.
- The API route must be a catch-all (`[[...path]]`) so every sub-path is handled by the same handler.
