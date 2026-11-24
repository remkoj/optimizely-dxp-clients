# Next.JS Optimizely One toolkit <!-- omit in toc -->

React components (both client & server) to integrate the browser-side products from Optimizely (Web Experimentation, Feature Experimentation, Data Platform, and Content Recommendations).

## Table of Contents <!-- omit in toc -->
- [1. Requirements](#1-requirements)
- [2. Installation \& Configuration](#2-installation--configuration)
  - [2.1. Add API Routes](#21-add-api-routes)
  - [2.2. Add Provider \& PageTracker to your layout](#22-add-provider--pagetracker-to-your-layout)
  - [2.3. Instrument your site with additional events](#23-instrument-your-site-with-additional-events)
  - [2.4. Enable session cookie for Visitor ID](#24-enable-session-cookie-for-visitor-id)
  - [2.5. Configuration](#25-configuration)
    - [2.5.1. Prevent key leakage and unauthorized access](#251-prevent-key-leakage-and-unauthorized-access)
    - [2.5.2. List of supported environment variables](#252-list-of-supported-environment-variables)
    - [2.5.3. Submit form data to ODP from a server action](#253-submit-form-data-to-odp-from-a-server-action)
    - [2.5.4. Preconnect and security policies](#254-preconnect-and-security-policies)
- [3. Usage](#3-usage)
  - [3.1. Optimizely One Gadget](#31-optimizely-one-gadget)
  - [3.2. Selecting the Web Experimentation project in browser](#32-selecting-the-web-experimentation-project-in-browser)
  - [3.3. Feature Experimentation decisions](#33-feature-experimentation-decisions)


## 1. Requirements
- Next.js `^16`
- React `^19`
- Node.js `>=24 <25` (the current workspace support and validation range)
- TypeScript 5+
- Access to the Optimizely One Products

## 2. Installation & Configuration

Start by adding the package to your project:
`yarn add @remkoj/optimizely-one-nextjs`

### 2.1. Add API Routes
**Required:** the gadget, client products, and script proxy use this catch-all
route to reach the package API. For the App Router, create:

`app/api/me/[[...path]]/route.ts`

Use the package handler for both methods:

```typescript
import { createOptimizelyOneApi } from '@remkoj/optimizely-one-nextjs/api';

const handler = createOptimizelyOneApi()

export const GET = handler
export const POST = handler
export const runtime = 'nodejs' // 'nodejs' (default) | 'edge'
export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const fetchCache = 'default-no-store'
```

In Next.js 16, `runtime` defaults to `nodejs`. The `dynamic` and `fetchCache`
segment options are optional and are not available when `cacheComponents` is
enabled; omit them in that configuration.

### 2.2. Add Provider & PageTracker to your layout
`<OptimizelyOne>` and `OptimizelyOneProvider` do not render the tracking
snippets. To load the enabled products, render `Scripts.Header` in the root
layout's `<head>` and `Scripts.Footer` near the end of `<body>`, alongside the
context provider and page activator.

The root layout wiring is shown below.

```typescript
import { Scripts } from '@remkoj/optimizely-one-nextjs/server'
import { OptimizelyOneProvider, PageActivator, OptimizelyOneGadget } from '@remkoj/optimizely-one-nextjs/client'

export type RootLayoutProps = {
    children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) 
{
    return <html>
        <head>
            <Scripts.Header />
        </head>
        <body>
            <OptimizelyOneProvider value={{ debug: true }}>
                <PageActivator />
                { children }
                <OptimizelyOneGadget servicePrefix='/api/me' refreshInterval={ 2000 } />
            </OptimizelyOneProvider>
            <Scripts.Footer />
        </body>
    </html>
}
```

### 2.3. Instrument your site with additional events
Whenever you want to track additional events, use the provided hook to get to the context and send events.

```typescript
'use client'
import React, { type FunctionComponent } from 'react'
import { useOptimizelyOne } from '@remkoj/optimizely-one-nextjs/client'

export const YourComponent : FunctionComponent<{}> = props => {
    const opti = useOptimizelyOne()

    function handler() 
    {
        opti?.track({ event: "name", action: "action" })
    }

    return <button onClick={() => handler()}>Output</button>
}
```

### 2.4. Enable the persistent Visitor ID cookie
Wrap your Next.js proxy with `withOptimizelyOne` from the server entry point.
It resolves the visitor ID before calling your proxy (for a new visitor the ID is
set on the request, so your proxy can read it from `request.cookies`) and, only when
the request has no visitor cookie or it differs, adds the cookie to the final response,
including rewrites and redirects, and makes it visible to the Server Components and
route handlers of the same request (so `cookies()` and `getUser()` know a new visitor
immediately). An existing cookie is never rewritten, so the
visitor's session stays stable.

```typescript
import { NextResponse, type NextProxy } from 'next/server'
import { withOptimizelyOne } from '@remkoj/optimizely-one-nextjs/proxy'

const baseProxy: NextProxy = request => NextResponse.next()

export const proxy = withOptimizelyOne(baseProxy)

export const config = {
    matcher: [
      // Skip all internal paths and paths with a '.'
      '/((?!.*\\.|ui|api|assets|_next\\/static|_next\\/image|_vercel).*)',
    ]
}
```

When composing other proxy decorators, wrap the composed proxy with
`withOptimizelyOne` last, for example:
`withOptimizelyOne(withMarkdownRouting(baseProxy))`. Import it from the
dedicated `@remkoj/optimizely-one-nextjs/proxy` entry point so Next.js does not
bundle unrelated server components into the proxy.

`Session.addVisitorId(response, visitorId, options)` uses the name configured by
`OPTIMIZELY_FRONTEND_COOKIE`. Its defaults are `maxAge: 31536000` seconds,
`sameSite: 'strict'`, `path: '/'`, and `secure` outside development. Pass
`maxAge`, `expires`, `sameSite`, `secure`, `path`, or `domain` in `options` to
override these defaults. Do not make the cookie `httpOnly`: browser-side
Optimizely integrations need to read the same visitor ID.

### 2.5. Configuration
The Optimizely One Integration is configured by setting the appropriate environment variables. 

#### 2.5.1. Prevent key leakage and unauthorized access
These environment variables must ***never*** be, consider them compromised when 
1. Comitted into your source control system. Set them using the method available on your hosting environment.
2. Configured to be exposed to the browser

Locally, you may use a `.env.local` file, which must be added to the ignore list of you source control system.

#### 2.5.2. List of supported environment variables
All variables are optional to the package. Set the variables marked as
conditionally required to enable the corresponding product or server-side
operation.

| Environment variable | Required when | Default | Purpose |
| - | - | - | - |
| `OPTIMIZELY_ONE_HELPER` | Never | `false` | Set to `1` to include the demo gadget (shown in the browser only while an Optimizely test cookie is present) and enable the Web Experimentation `pid` override. |
| `OPTIMIZELY_DEBUG` | Never | `false` | Set to `1` to enable Optimizely debug logging. |
| `OPTIMIZELY_FRONTEND_COOKIE` | Never | `visitorId` | Name of the visitor ID cookie shared with browser-side products. |
| `OPTIMIZELY_DATAPLATFORM_ID` | When using ODP; use a private key for server-side submissions | None | Public or private ODP API key. |
| `OPTIMIZELY_DATAPLATFORM_ENDPOINT` | Never | `https://api.zaius.com/` | ODP service endpoint. Takes precedence over the deprecated misspelling below. |
| `OPTIMIZLEY_DATAPLATFORM_ENDPOINT` (deprecated) | Only as a legacy fallback | `https://api.zaius.com/` | Deprecated misspelled ODP endpoint key, read only when the corrected key is unset. |
| `OPTIMIZELY_DATAPLATFORM_BATCH_SIZE` | Never | `25` | Maximum ODP audience-query batch size. |
| `OPTIMIZELY_CONTENTRECS_CLIENT` | For Content Recommendations | None | Content Recommendations client ID. |
| `OPTIMIZELY_CONTENTRECS_DELIVERY` | For the Content Recommendations tracking script | `0` | Delivery ID used by the tracking script. |
| `OPTIMIZELY_CONTENTRECS_DELIVERY_KEY` | For Content Recommendations API requests | None | Delivery key used to fetch visitor topic and goal information. |
| `OPTIMIZELY_CONTENTRECS_DOMAIN` | Never | `idio.co` | Content Recommendations domain without a service prefix. |
| `OPTIMIZELY_WEB_EXPERIMENTATION_PROJECT` | For Web Experimentation | None | Web Experimentation project ID. |
| `OPTIMIZELY_FX_SDKKEY` | For Feature Experimentation decisions | None | SDK key that enables the provider and decision hooks. |
| `OPTIMIZELY_FX_PROJECT` | Never | None | Optional project ID shown in the Feature Experimentation gadget. |
| `OPTIMIZELY_FX_PAT` | Only for server integrations that need a PAT | None | Optional Personal Access Token; never expose it to browser code. The SDK does not need it to make decisions. |
| `OPTIMIZELY_FX_PROXY` | Never | `false` | Boolean. Serves and caches the Feature Experimentation datafile through the application, see [3.3](#33-feature-experimentation-decisions). |
| `OPTIMIZELY_FX_WEBHOOK_SECRET` | Never | None | Optional secret to verify the signature (`X-Hub-Signature`) of the datafile webhook. Server-side only. |

`readConfigFromEnv()` also reads the standard `NODE_ENV` variable (default:
`production`); it is not an Optimizely-specific `EnvVars` entry.

#### 2.5.3. Write to ODP from a server action

Any server-side write to ODP (profile upsert, event, form submit) must include
the visitor's `vuid` AND `fs_user_id` (the visitor cookie) in the profile
attributes and event identifiers. Use `DataPlatform.Tools.getVisitorIdentifiers`
(or the client methods below, which call it); never send only the email or only
the VUID. Without both, ODP won't merge the submission into the visitor's
existing profile, and the gadget, real-time segments and personalisation never
see the submitted data.

`DataPlatform.Tools.getVisitorIdentifiers(cookies)` returns `vuid` (from the
`vuid` cookie), `fs_user_id` (from the cookie configured with
`OPTIMIZELY_FRONTEND_COOKIE`) and, when present, `content_intelligence_id` (from
the `iv` cookie), mirroring what the browser client sends. The
`DataPlatform.Client` methods `upsertProfile(attributes, cookies)`,
`sendEvent(event, cookies)` and `identify({ email, attributes }, cookies)` add
these identifiers to the profile attributes and event identifiers
automatically. When the cookies lack the identifiers, the write continues by its
own identifier (such as `email`) and a warning is logged; a write without any
identifier throws.

Use `DataPlatform.submitForm(cookies, { email, fields, event })` from the
server-only Data Platform entry point for form submissions. It upserts the
profile and then records the event. Configure an ODP private API key; without
one the submission is skipped (see below).

```typescript
'use server'

import { cookies } from 'next/headers'
import DataPlatform from '@remkoj/optimizely-one-nextjs/data-platform/server'

export async function submitContact(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const name = String(formData.get('name') ?? '').trim()
  if (!email || !name) throw new Error('Name and email are required')

  await DataPlatform.submitForm(await cookies(), {
    email,
    fields: { name },
    event: {
      type: 'form',
      action: 'submit',
      data: { form_name: 'Contact' }
    }
  })
}
```

The helper skips the submission, without throwing, when ODP cannot be written to:

| `OPTIMIZELY_DATAPLATFORM_ID` | Result |
| --- | --- |
| Not set | Nothing is sent. A debug message is written, only when `NODE_ENV` is not `production` or `OPTIMIZELY_DEBUG` is enabled. |
| Public key only | Nothing is sent. A warning is always written to stderr, as the form data is lost. |
| Private key (`<public>.<private>`) | The profile is upserted and the event is sent. |

The helper throws a `DataPlatformError` when either ODP request fails. Its
`status` property holds the HTTP status and its `detail` property the ODP
response body (a single line of at most 500 characters, with the private key and
the submitted values replaced by `[redacted]`). The `detail` is not part of the
`message`; it can still contain personal data, so only log it where that is
acceptable. Handle these errors in the server action according to the
application's form UX. The `DataPlatform.Client` methods `upsertProfile`,
`sendEvent` and `identify` keep throwing a `DataPlatformError` when no private
key is configured.

To verify the merge, submit the form in a browser session and query ODP with
that browser's VUID: `customer(vuid: "<browser vuid>") { email }` must return
the profile holding the submitted email. ODP merges asynchronously, so allow 15
seconds to about a minute before the gadget shows the profile.

#### 2.5.4. Preconnect and security policies

`Scripts.Header` renders deduplicated preconnect hints for the configured
tracking-script and API origins. If Content Recommendations values are
overridden through `Scripts.Footer` props, pass the same values to
`Scripts.Header` so its resource hints match the script host.

The `@remkoj/optimizely-one-nextjs/security` entry point exposes
`getSecurityPolicySources`, `buildContentSecurityPolicy`, and
`buildOptimizelySecurityHeaders`, plus `applyDynamicSecurityHeaders` for the
proxy. The helpers derive external sources from enabled snippet configuration
and merge application-owned sources.

**Recommended setup:** put the policy that is the same for every request in
`next.config.ts` and apply only request-dependent policy in `proxy.ts`. The two
files must build on the same base sources, so keep them in one shared module.
The entry point can be loaded from `next.config.ts` (plain Node ESM) and reads
the product configuration from the environment.

1. Define the host's base sources once. Next.js needs inline scripts, and
   development also needs `'unsafe-eval'` and websockets for HMR; add those in
   development only, the helpers never add them.

```typescript
// src/security.ts
import type { SecurityPolicySources } from '@remkoj/optimizely-one-nextjs/security'

export function baseSources(isDevelopment: boolean): Partial<SecurityPolicySources> {
  return {
    'script-src': ["'self'", "'unsafe-inline'", ...(isDevelopment ? ["'unsafe-eval'"] : [])],
    'connect-src': ["'self'", ...(isDevelopment ? ['ws:', 'wss:'] : [])],
    'img-src': ["'self'", 'data:'],
    'frame-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'font-src': ["'self'", 'data:'],
    'worker-src': ["'self'"]
  }
}
```

2. Apply the static policy in `next.config.ts`. Passing
   `webExVeActive: false` leaves the Web Experimentation visual editor (VE)
   sources out of the policy served to everybody else (omit it to include them
   for every request and skip step 3):

```typescript
// next.config.ts
import type { NextConfig } from 'next'
import { buildOptimizelySecurityHeaders } from '@remkoj/optimizely-one-nextjs/security'
import { baseSources } from './src/security'

const isDevelopment = process.env.NODE_ENV === 'development'
const securityHeaders = buildOptimizelySecurityHeaders(baseSources(isDevelopment), { webExVeActive: false })

const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: '/:path*',
      headers: Object.entries(securityHeaders).map(([key, value]) => ({ key, value }))
    }]
  }
}

export default nextConfig
```

3. Add the request-dependent sources in `proxy.ts` with
   `applyDynamicSecurityHeaders(headers, base, options)`. A proxy cannot read
   the headers set by `headers()` in `next.config.ts`, and a
   `Content-Security-Policy` set in the proxy replaces the static one on the
   routes the proxy matches. The helper therefore builds the complete policy from
   the same `base` and sets `Content-Security-Policy` and
   `Cross-Origin-Opener-Policy` on the headers you pass (typically
   `response.headers`). `options.webExVeActive` overrides the configuration for
   this request (`false` omits the VE sources, anything else includes them),
   `options.extra` adds further request-dependent sources and `options.config`
   passes a partial configuration. The package does not detect the VE: the host
   supplies that check, and the proxy matcher must cover every route the VE can
   open. Only call the helper for the requests that need it; all other requests
   keep the static policy.

```typescript
// proxy.ts
import { withOptimizelyOne } from '@remkoj/optimizely-one-nextjs/proxy'
import { applyDynamicSecurityHeaders } from '@remkoj/optimizely-one-nextjs/security'
import { NextResponse, type NextProxy, type NextRequest } from 'next/server'
import { baseSources } from './src/security'

// The host implements this check, e.g. on a query parameter or cookie it controls
declare function isVisualEditorActive(request: NextRequest): boolean

const baseProxy: NextProxy = (request) => {
  const response = NextResponse.next()
  if (isVisualEditorActive(request))
    applyDynamicSecurityHeaders(response.headers, baseSources(process.env.NODE_ENV === 'development'), { webExVeActive: true })
  return response
}

export const proxy = withOptimizelyOne(baseProxy)

export const config = {
  // Every page the visual editor can open
  matcher: ['/((?!api(?:/|$)|_next(?:/|$)|.*\\..*).*)']
}
```

Real implementations should use the widened matcher shown above (all pages except
`/api`, `/_next` and files with an extension); the sample site deliberately uses a
narrower one. The request check can be forged by anyone, so a request-based check only
widens the policy with the Optimizely hosts for that request. Responses that
differ per request must not be shared-cached without a matching `Vary`.

The inline snippets rendered by this package carry no nonce, so a nonce-only
`script-src` blocks them; keep `'unsafe-inline'` (a nonce makes browsers ignore it).

The returned headers include `Content-Security-Policy` and the recommended
`Cross-Origin-Opener-Policy: same-origin`. The helper manages the `script-src`,
`connect-src`, `img-src`, `frame-src`, `style-src`, `font-src` and `worker-src`
product directives; directives without sources are omitted. When Web
Experimentation is configured, this includes the origins the visual editor
(VE) needs: it injects scripts, styles and fonts from the Optimizely app and
Opal hosts, connects to their APIs and WebSockets, and runs a Session Replay
worker from a `blob:` URL. These VE entries are included by default; pass
`webExVeActive: false` in the optional `config` argument (the second argument of
`buildContentSecurityPolicy`/`buildOptimizelySecurityHeaders`, the only argument
of `getSecurityPolicySources`) to omit them, leaving only the core Web
Experimentation sources. `undefined`, `null` and `true` all include them, and
without a Web Experimentation project no Web Experimentation sources are
emitted regardless of this option. A directive that is emitted replaces the browser's
`default-src` fallback, so pass the host's own base sources (such as `'self'`
and `'unsafe-inline'`) for `style-src`, `font-src` and `worker-src` as in the
examples above. Retain the rest of the host application's policy. Next.js
development requires `'unsafe-eval'` in `script-src` and `ws:`/`wss:` in
`connect-src` for HMR; add them in development only, as the helpers do not add
HMR sources to the policy output.

## 3. Usage
When leveraging the components and structure from the installation, everything should work immediately.

### 3.1. Optimizely One Gadget
The gadget is built on Optimizely Axiom (`@optiaxiom/react`), which injects its
own scoped styles; no stylesheet import is required. It renders as a floating
"DXP" button fixed to the bottom-right corner of the viewport, which opens a
panel with the available tabs.

The server `OptimizelyOneGadget` (also rendered by `<OptimizelyOne>`) only
includes the client gadget when `OPTIMIZELY_ONE_HELPER` is true. In the browser
the gadget stays hidden until an Optimizely test cookie (`optly_<domain name>_test`,
any value) is present, as set by the bookmark or the Optimizely browser extension
(see [Set a test cookie](https://docs.optimizely.com/web-experimentation/docs/set-a-test-cookie-to-preview-a-live-campaign-or-experiment)),
and hides again when the cookie is removed. The check is fully client side (Cookie
Store `change` events where supported, otherwise polling every 500ms).

**Site styles must use a CSS layer.** Axiom's styles live in the `optiaxiom`
CSS layer, and unlayered CSS always beats layered CSS regardless of specificity.
Put all custom site styles (global resets and element selectors such as
`button`, `a`, `svg`) inside a named `@layer` and declare the order so
`optiaxiom` comes last, otherwise the site can override the gadget:

```css
@layer site, optiaxiom;

@layer site {
  button { /* ... */ }
}
```

With Tailwind CSS v4, use `@layer theme, base, components, utilities, optiaxiom;`.

As a safety net, the gadget prepends a `@layer <site layers>, optiaxiom;`
statement when it mounts, so Axiom wins over the layers present in the page.
Declaring the order yourself remains the recommended setup.

The OptimizelyOneGadget will only show if the following two criteria have been met, this ensures that the gadget is only available when it has intentionally ben enabled:
 1. The environment variable `OPTIMIZELY_ONE_HELPER` has been set to "1"
 2. A test-cookie has been added to the browser using the 'Add test cookie' feature of the [Optimizely Assistant Chrome Add-On](https://support.optimizely.com/hc/en-us/articles/4410289500301-Optimizely-Experimentation-Assistant-Chrome-extension)

Once opened, the gadget stays open - also across page navigations and reloads within the browser session - until the close button in its header is clicked or Escape is pressed. Clicking outside of it does not close it, so you can follow how the profile changes while navigating the site.

Using the Optimizely One Gadget it is possible to demonstrate the in-session behaviour tracking and analysis performed by the configured Optimizely products.

### 3.2. Selecting the Web Experimentation project in browser
When the `OPTIMIZELY_ONE_HELPER` is set to "1" - or the Scripts.Header component has been instructed to do so explicitly - it is possible to change the Optimizely Web Experimentation project on the fly. This is done by adding a query string parameter `?pid=`, with the new project id.

The project id is persisted in localStorage with the key `_pid` and needs to be removed manually to revert back to the configured Web Experimentation project.

### 3.3. Feature Experimentation decisions
When `OPTIMIZELY_FX_SDKKEY` is configured, `<OptimizelyOne>` mounts the
Feature Experimentation SDK provider with the same visitor ID cookie used by
the server-side Session helpers. The provider creates a stable fallback ID and
persists it to the configured frontend cookie only if the cookie is absent.
The gadget then displays current decisions for all active feature flags.

Use the exported decision hooks in client components:

```tsx
'use client'

import { useDecide } from '@remkoj/optimizely-one-nextjs/client'

export function NewCheckout() {
  const { decision, isLoading, error } = useDecide('new-checkout')
  if (isLoading) return <p>Loading decision…</p>
  if (error) return <p>Unable to load feature decision: {error.message}</p>

  return decision?.enabled ? <NewCheckoutExperience /> : <ClassicCheckout />
}
```

The hooks (`useDecide`, `useDecideForKeys`, `useDecideAll` and their `Async`
variants), the `OptimizelyDecideOption` enum and the `OptimizelyDecision` and
`OptimizelyUserContext` types are all exported from
`@remkoj/optimizely-one-nextjs/client`, so your application does not need its
own dependency on `@optimizely/react-sdk`.

The SDK key identifies the decision project. `OPTIMIZELY_FX_PROJECT` is
optional display metadata, and `OPTIMIZELY_FX_PAT` remains server-side for
applications that need authenticated Feature Experimentation API access.

#### Shared visitor and decision methods
Both sides decide for the same visitor: the visitor ID in the frontend cookie,
plus optional attributes. Decisions are plain objects (no `userContext`), so they
can be passed from Server to Client Components.

```tsx
// Client Component
import { useFeatureExperimentation } from '@remkoj/optimizely-one-nextjs/client'

const { user, setAttributes, decide, decideForKeys, decideAll } = useFeatureExperimentation()
setAttributes({ plan: 'pro' })
const decision = await decide('new-checkout')

// Server Component / route handler
import { getUser, decide, decideForKeys, decideAll } from '@remkoj/optimizely-one-nextjs/feature-experimentation/server'

const user = await getUser({ plan: 'pro' })
const decision = user ? await decide('new-checkout', { user }) : undefined
```

Pass the same attributes to the browser with `<OptimizelyOne fxAttributes={{ plan: 'pro' }}>`.
`fxAttributes` are the initial attributes: they must be static, so don't read `cookies()`
or `headers()` in the layout to compute them, as that makes the whole layout dynamic. For
values that need the request, pass a Server Function (or client function) as
`fxResolveAttributes`. It is executed asynchronously in the browser, once per visitor,
and its result is merged into the initial attributes, which updates the decisions of
`useFeatureExperimentation`. The page shell stays static.

```typescript
// app/fx-attributes.ts
'use server'
import { cookies, headers } from 'next/headers'
export async function resolveAttributes(user: FeatureExperimentationUser) {
  const plan = (await cookies()).get('plan')?.value
  const country = (await headers()).get('x-vercel-ip-country')
  return { plan, country }          // serializable values only
}

// app/layout.tsx (static)
<OptimizelyOne fxAttributes={{ plan: 'anonymous' }} fxResolveAttributes={resolveAttributes}>
```

Client functions can't be props of the Server Component `<OptimizelyOne>`; render
`<ResolveFeatureExperimentationAttributes resolve={fn} />` from
`@remkoj/optimizely-one-nextjs/client` inside it instead. Decisions made before the
function resolves use the initial attributes. The same function can be called in
server-side islands (`getUser(await resolveAttributes(...))`) so both sides decide alike.
`getUser` reads the visitor cookie, which `withOptimizelyOne` sets on the response
and also exposes to the Server Components and route handlers of that same request, so
the visitor is known on a new visitor's first request too. It returns `undefined` only
for routes the proxy doesn't run for (see its `matcher`) that have no cookie yet.

In the proxy itself `cookies()` is not available. Use `getOrCreateUser(request, attributes)`:
it always returns a visitor, and a new visitor gets the ID that `withOptimizelyOne` writes to
the cookie, whether your code runs before or inside the wrapper, so `decide()` can be used
with it on the very first request. `getUser(attributes, request)` also reads the cookie from
the request, but only finds a new visitor inside the proxy wrapped by `withOptimizelyOne`.
The `user` option is required for the server methods and optional (defaults to the
visitor of the provider) for the client methods.

#### Rendering decisions without hydration errors

The visitor ID only exists in the browser, so `useFeatureExperimentationUser()` and
`useFeatureExperimentation()` return `user: undefined` and `ready: false` while rendering
on the server and during hydration, and the visitor right after. Never render the
visitor or a client-side decision before `ready`, so the server HTML and the first client
render are identical.

- **Decide in the browser:** call `decide` in an effect when `ready`, render a fallback
  (skeleton, default variant or `null`) until it resolves. The page shell stays static;
  there can be a flicker, so reserve space.
- **Decide on the server:** in a Server Component (inside `<Suspense>` to keep the shell
  static, which needs `cacheComponents: true` on Next 16), use `getUser()` and `decide()`
  and pass the plain decision to the Client Component as a prop. The first HTML has the
  right variant. `cookies()`/`headers()` make this part of the tree dynamic.

See the `AGENTS.md` of this package for the full comparison and examples.

#### ODP real-time audiences

Audiences backed by ODP real-time segments work on client and server once ODP is configured in
this package (`OPTIMIZELY_DATAPLATFORM_ID`) and the ODP integration is enabled in the Feature Experimentation project (Settings > Integrations >
Data Platform Real-Time Audiences) and an ODP audience is attached to a running rule. No
ODP private key is needed. Without `OPTIMIZELY_DATAPLATFORM_ID` no ODP manager is created and nothing is fetched. Otherwise both SDK clients get an ODP manager, so
`decide*()` fetches the visitor's segments automatically (use `skipSegments` or
`segmentOptions: ['IGNORE_CACHE' | 'RESET_CACHE']` to control that).
`getQualifiedSegments()` (server import and `useFeatureExperimentation()`) returns the
segment names. Segments are looked up with the ODP visitor ID (the `vuid` cookie of the ODP tracker,
added by `getUser()` / `getOrCreateUser()` and read from the cookie in the browser), because the SDK's
own `fs_user_id` lookup only works when ODP has `fs_user_id` registered as a customer identifier; without
a `vuid` the SDK lookup is used. Already known segments can be supplied through `user.qualifiedSegments`
or, for the browser, `<OptimizelyOne fxQualifiedSegments={segments}>` (visitor specific, so only
in layouts that are dynamic already). Segments lag ODP by up to ~90 seconds, so use attributes
where instant accuracy is needed.

#### Datafile proxy
Set `OPTIMIZELY_FX_PROXY=true` to cache the datafile in your application, instead of
having the browser and server fetch it from the Optimizely CDN. Add two routes:

```typescript
// app/api/fx/datafile/route.ts
import { createDatafileHandler } from '@remkoj/optimizely-one-nextjs/feature-experimentation/server'

export const GET = createDatafileHandler()
export const dynamic = 'force-static' // Retrieves and caches the datafile during `next build`
```

```typescript
// app/api/fx/webhook/route.ts
import { createWebhookHandler } from '@remkoj/optimizely-one-nextjs/feature-experimentation/server'

export const POST = createWebhookHandler()
```

- The datafile is stored in the Next.js data cache (tag `optimizely-fx-datafile`), so it
  is retrieved only during the build and after the webhook purged it. The server-side
  decision methods use the same cached datafile.
- The browser reads the datafile from `/api/fx/datafile`. If you use another path (or a
  `basePath`), set it with `<OptimizelyOne fxProxyPath="/my/base/path" />`; the routes
  must end in `/datafile` and `/webhook`.
- At Feature Experimentation, create a webhook (Settings → Webhooks) for the
  `project.datafile_updated` event with the URL `https://<your-site>/api/fx/webhook`. Set
  the webhook's secret as `OPTIMIZELY_FX_WEBHOOK_SECRET`; requests with an invalid
  `X-Hub-Signature` are rejected with a 401. Other events, and datafiles of other SDK
  keys, are ignored.
- Without `OPTIMIZELY_FX_PROXY` both routes respond with 404, and the browser and the server
  retrieve the datafile directly from the CDN.
