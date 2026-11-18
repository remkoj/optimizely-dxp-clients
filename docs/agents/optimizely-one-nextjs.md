# @remkoj/optimizely-one-nextjs

- **Path:** `packages/optimizely-one-nextjs`
- **Module:** ESM
- **Build tool:** `tsc`
- **Node:** `>=24.0.0 <25.0.0`

## Scripts

| Script | Command |
| --- | --- |
| `prepare` | `tsc --build --force` |
| `watch` | `tsc --watch` |
| `clean` | `tsc --build --clean` |
| `recompile` | `tsc --build --clean && tsc --build --force` |

## Gadget visibility

- `server-components/optimizely-one-gadget.tsx` returns `null` unless
  `OPTIMIZELY_ONE_HELPER` is true, so the client gadget (a `next/dynamic`,
  `ssr: false` import) is never rendered otherwise. `<OptimizelyOne>` also
  guards on `config.HelperEnabled`.
- `gadget.tsx` renders `null` until `useOptimizelyTestCookie()`
  (`components/optimizely-one-gadget/_test-cookie.ts`) reports an
  `optly_<domain name>_test` cookie (any value). The state starts `false` for
  hydration safety, and updates through `cookieStore` `change` events when
  available, otherwise a 500ms poll. Never read this cookie on the server.

## Gadget styling

- The gadget is built on `@optiaxiom/react` (Axiom) and ships no stylesheet;
  Axiom injects its own scoped styles through `AxiomProvider`. There is no
  `dist/styles.css`, Tailwind, or `oo:` class prefix anymore.
- `gadget.tsx` renders a `position: fixed` "DXP" pill (bottom-right, z-index
  2999, just below Axiom's popper layer at 3000) in Optimizely brand green
  (`#3be081`, with darker hover/active shades) and bold dark text, with
  1.5rem horizontal padding. It opens a `PopoverContent` above it that is
  `calc(100vw - 2rem)` wide by default, 75vw from 768px (Tailwind `md`) and
  50vw from 1280px (`xl`), and `min(30rem, 100vh - 6rem)` tall. The tab list
  has 1rem inline padding at both ends, scrolls horizontally (never wraps, no
  vertical scrollbar) and supports click-and-drag scrolling through
  `useDragScroll` in `_ui.tsx` (drags over 4px capture the pointer and suppress
  the resulting click; touch scrolls natively). Each tab panel scrolls
  vertically.
- The popover is controlled: it only closes via the close button in the gadget
  header or the Escape key. Outside clicks/focus and clicking the trigger while
  open are ignored (`onInteractOutside` is prevented), so the gadget stays open
  while the demo user navigates. The open state is stored in
  `sessionStorage` (`opti-one-gadget-open`) to survive full page loads.
- `_styles.ts` holds the gadget's only custom CSS (`GADGET_CSS`, rendered in a
  `<style>` element by `gadget.tsx`): brand colours and hover states, the
  responsive width, and a reset of inherited properties (font family, size,
  weight, letter-spacing, text-transform, alignment, direction). Axiom's CSS
  lives in the `optiaxiom` cascade layer, so unlayered host CSS beats it; the
  gadget rules are deliberately unlayered and scoped to the
  `opti-one-gadget-trigger` / `opti-one-gadget-content` classes so host
  typography cannot leak in. Hosts that ship unlayered global element resets
  (e.g. `button`, `svg`, `a`) can still override Axiom's descendant styles.
  `ensureAxiomLayerOrder()` (called from `gadget.tsx` in a layout effect)
  guards against the opposite problem: when Axiom's stylesheet loads before the
  site's, `optiaxiom` ends up *below* the site's layers (e.g. Tailwind `base`
  preflight resets padding and border-radius). It prepends a
  `<style id="opti-one-gadget-layer-order">@layer <host layers>, optiaxiom;</style>`
  so Axiom wins over all layers present at mount. Layers added to the page later
  are not covered.
  Consumers are therefore instructed (package `AGENTS.md` and `README.md`,
  "Site styles must use a CSS layer") to put all site styles in a named
  `@layer` declared before `optiaxiom`; keep that instruction in sync when
  changing how the gadget is styled.
- Panels share the building blocks in `_ui.tsx` (`DefinitionList`/`Term`/
  `Description`, `ItemList`/`ListItem`, `Section`, `PoweredBy`) and `_notice.tsx`
  (Axiom `Alert`). Use these and Axiom props instead of raw class names so all
  panels stay consistent.
- Axiom icons take `size`, not `width`/`height`.
- The Graph panel maps official sources `default`, `cmp`, `cmpsc`, `hub`, and
  `ocp` to readable product names; `cmp` is labeled Optimizely DAM.

## Feature Experimentation

- `OPTIMIZELY_FX_SDKKEY` enables the package's Feature Experimentation provider.
- The provider's SDK client is cached at module level per SDK key, so React
  re-renders/Strict Mode don't create duplicate clients or datafile requests.
- The provider uses the configured frontend visitor cookie, creating and
  persisting a stable fallback only when no cookie is present.
- `useDecide`, `useDecideForKeys`, `useDecideAll`, and async variants are
  re-exported from the `./client` entry point, together with the
  `OptimizelyDecideOption` enum and the `OptimizelyDecision` and
  `OptimizelyUserContext` types, so consumers don't depend on the SDK directly.
- The gadget's Feature flags panel uses `useDecideAll` and is enabled when the
  SDK key is configured. Each flag is an Axiom `Disclosure` (collapsed by
  default) whose heading shows the flag key and state; the details are a
  definition list (variation, rule) plus an Axiom `Table` of its variables.
  All text in the panel is the same size, matching the other panels
  (`FX_PANEL_CLASS` in `_styles.ts` sets Axiom's `sm` size and forces
  `font-size: inherit` below it); only the headings (`FX_HEADING_CLASS`, 1.125em)
  are larger.
  `OPTIMIZELY_FX_PROJECT` is display metadata, passed by `gadget.tsx` to the
  panel as `featureExperimentationProject` and shown only when set;
  `OPTIMIZELY_FX_PAT` is read as server-side config and must not be sent to
  client components.

### Shared user, decisions and datafile proxy

- `src/products/feature-experimentation/index.ts` is isomorphic (no directives, no
  Node deps; exported as the `FeatureExperimentation` namespace and, as types, from
  `./client`): `FeatureExperimentationUser`/`Attributes`/`Decision`, `createUser`,
  `mergeAttributes`, `toDecision`, the path helpers and `DATAFILE_TAG`.
  `toDecision` copies fields explicitly and drops `userContext`, a class instance
  that can't cross the Server/Client boundary.
- `server-index.ts` (`import 'server-only'`, exported as
  `./feature-experimentation/server`) uses `@optimizely/optimizely-sdk` directly —
  `@optimizely/react-sdk` calls `createContext` and cannot be imported on the server.
  It holds `getUser` (visitor cookie; the optional second argument is a `VisitorCookieSource` from
  `utils/session.ts`: the `cookies()` store or a request such as the proxy's `NextRequest`, because
  `cookies()` throws in a proxy), `getOrCreateUser(request, attrs)` (proxy; uses
  `Session.getOrCreateVisitorId`, which remembers a generated ID per request in a `WeakMap`, so
  the proxy code and `withOptimizelyOne` agree on the new visitor's ID in any order), `decide`/`decideForKeys`/`decideAll`,
  `getDatafile`, `purgeDatafile` and the route handler factories
  `createDatafileHandler` / `createWebhookHandler`.
- `provider.tsx` adds `datafileUrl` (polling manager `urlTemplate`) and `attributes`
  props, plus `useFeatureExperimentationUser` and `useFeatureExperimentation`. Clients
  are cached per `sdkKey|datafileUrl`.
- `OPTIMIZELY_FX_PROXY` (boolean) and `OPTIMIZELY_FX_WEBHOOK_SECRET` (server-only, never
  pass to client components) are in `EnvVars` and `readConfigFromEnv`. `OptimizelyOne`
  takes `fxProxyPath` (default `/api/fx`), `fxAttributes` (static initial attributes) and
  `fxResolveAttributes` (Server Function or client function, executed in the browser).
  The provider renders `ResolveFeatureExperimentationAttributes` (exported from
  `client.ts`) for it, which runs once per visitor ID and merges the result via
  `setAttributes`; errors are logged and leave the attributes unchanged. Client
  functions cannot be props of the server component `OptimizelyOne`.
- The visitor is browser-only, so the provider is hydration-safe: `ready` comes from
  `useSyncExternalStore` (`false` on the server and while hydrating), `user` and the
  provider's SDK user are `undefined` until then, and the cookie write is deferred to
  `ready`. `whenReady` (context) lets `decide*` wait for the visitor when called early.
  Keep the consumer guidance ("Rendering decisions without hydration errors", patterns
  "decide in the browser" and "decide on the server") in the package `AGENTS.md` in sync.
- ODP real-time audiences: `index.ts` has the shared `createUserContext(client, user, {skipSegments,
  segmentOptions})` and `fetchQualifiedSegments` helpers, used by both the server `decide*`/
  `getQualifiedSegments` and the provider's `useFeatureExperimentation`. The server clients get
  `createOdpManager()` and the browser client gets `FX.createOdpManager`, both only when
  `checkProductStatus(config).dataPlatform` (`OPTIMIZELY_DATAPLATFORM_ID`) is true; the server checks it
  itself (`isOdpConfigured`), the browser gets it as `odpEnabled` provider prop from `OptimizelyOne`
  (default `false`, part of the client cache key). When false, `skipSegments` is forced on.
  `user.qualifiedSegments` / provider `qualifiedSegments` / `OptimizelyOne` `fxQualifiedSegments`
  skip the fetch. `createUserContext` looks segments up itself by `vuid` (`user.vuid`, set by `getUser`/
  `getOrCreateUser` via `Session.getOdpVisitorId`, or read from `document.cookie` in the browser) with a
  GraphQL request built from the datafile `integrations` (host, public key) and the `odp.audiences` segment
  names of the audiences, cached 30s per visitor; the SDK's `fs_user_id` lookup is only the fallback, because
  ODP rejects `fs_user_id` as unknown argument unless it is a registered customer identifier and the SDK then
  silently returns no segments. `provider.tsx` fetches the segments itself (effect; waits up to 5s for the `vuid` cookie via
  `readVuidCookie`) and passes them as `qualifiedSegments` to `FX.OptimizelyProvider` with `skipSegments` always on,
  because the React SDK would otherwise overwrite them with its own (failing) `fs_user_id` lookup.
  `isOdpIntegrated()` (datafile has `integrations`) gates the fetch. Keep the
  "ODP real-time audiences" section in the package `AGENTS.md` and README in sync.
- With the proxy enabled, `getDatafile` fetches the CDN with `cache: 'force-cache'` and
  `next.tags: ['optimizely-fx-datafile']`; `purgeDatafile` calls
  `revalidateTag(tag, { expire: 0 })`. The server SDK client is built with a static
  config manager and re-created when the datafile `revision` changes. Without the
  proxy, the server uses a polling config manager and the browser the CDN.
- The datafile route must be exported by the application with a literal
  `export const dynamic = 'force-static'` (it can't be re-exported from the package), so
  `next build` prerenders it and fills the data cache. Verified: Next keeps the
  handler's `Cache-Control` and tags the route output with the datafile tag.
- `withOptimizelyOne` (`src/proxy.ts`) writes the visitor cookie on the response and,
  via `exposeVisitorId`, overrides the request's `cookie` header
  (`x-middleware-override-headers` / `x-middleware-request-cookie`, as
  `NextResponse.next({ request })` does, merged with downstream overrides) so `getUser`
  also works on a new visitor's first request. Only routes matched by the proxy get
  this. `OptimizelyOne` deliberately doesn't call `cookies()` so layouts stay
  statically renderable.
- Webhook: `X-Hub-Signature` is `sha1=` + HMAC-SHA1 (hex) of the raw body; compare
  with `timingSafeEqual`. Only `project.datafile_updated` for the configured SDK key
  (matched on `data.cdn_url`) purges.

Validate Feature Experimentation wiring in `samples/basic-project` by
configuring a test SDK key and rendering the `/single` or `/multi` route. The sample
has `OPTIMIZELY_FX_PROXY=true` and the routes in `src/app/api/fx/`; after
`yarn next build` check that `.next/server/app/api/fx/datafile.body` exists.

## Server-side ODP submissions

- Every server-side ODP write must carry the visitor's `vuid` AND `fs_user_id`
  (the `OPTIMIZELY_FRONTEND_COOKIE` cookie), as the browser client sends them
  with `zaius.customer`. Without both, ODP cannot merge the write into the
  visitor's profile. `DataPlatform.Tools.getVisitorIdentifiers(cookies)` returns
  `vuid`, `fs_user_id` and, when present, `content_intelligence_id` (`iv` cookie).
- `DataPlatform.Client` exposes private-key `upsertProfile(attributes, cookies)`,
  `sendEvent(event, cookies)` and `identify({ email, attributes }, cookies)` for
  the ODP `/v3/profiles` and `/v3/events` endpoints. They always add the
  identifiers from the cookies (taking precedence over caller values); missing
  cookies log a warning and the write falls back to its own identifier, and a
  write without any identifier throws a `DataPlatformError`.
- `DataPlatform.submitForm(cookies, { email, fields, event })` is exported only
  from the `@remkoj/optimizely-one-nextjs/data-platform/server` entry point.
  Import its default `DataPlatform` namespace in a server action. It calls
  `identify` and then `sendEvent` (with `email` added to the event identifiers).
- The helper throws if the ODP private API key is missing or if either API call
  fails. This subpath is isolated from server components so it is safe to import
  from Next.js route handlers and server actions. Do not import it into client
  components.
- Verify with `customer(vuid: <browser vuid>)`: it must return the profile that
  holds the email. ODP merges asynchronously (15 seconds to about a minute).

## Gadget profile lookup

- `DataPlatformClient.getProfileInfo` resolves the profile with
  `customer(vuid:)`, so any VUID known to the profile matches. An
  `INVALID_IDENTIFIER_EXCEPTION` means "no profile" and is not logged.
- `/api/me?scope=profile` returns `profile: null` plus `profileState`:
  `identified`, `anonymous` (no VUID, or a profile without email, name or phone)
  or `unknown` (ODP has no profile for the VUID). The panel shows "No profile
  found for visitor <vuid>" for `unknown` and "Anonymous session" otherwise.

## Visitor cookie

- `withOptimizelyOne` (`./proxy`) only sets the visitor cookie when the request
  has none or it differs, so the visitor's session is stable. In that case it also
  exposes the cookie to the current request (see `exposeVisitorId`). Before calling
  the downstream proxy it also does `request.cookies.set(...)`, so the downstream
  proxy reads the same ID from `request.cookies` for a new visitor (don't use
  `Session.getOrCreateVisitorId` there; it would generate a different ID).

## Resource hints and security policies

- `Scripts.Header` emits deduplicated preconnect hints for configured tracking
  scripts and API origins. Keep Content Recommendations host overrides in sync
  between the header and footer script components.
- The `./security` subpath exports `getSecurityPolicySources`,
  `buildContentSecurityPolicy`, `buildOptimizelySecurityHeaders`, and
  `getOptimizelyResourceHints`. These derive product origins and CSP directives
  from configuration; the header builder adds
  `Cross-Origin-Opener-Policy: same-origin`.
- `SecurityPolicySources` covers `script-src`, `connect-src`, `img-src`,
  `frame-src`, `style-src`, `font-src` and `worker-src`; empty directives are
  omitted. With Web Experimentation configured the visual editor origins (Optimizely
  app and Opal hosts, their API/WebSocket hosts, Google Analytics, `blob:`
  workers) are included unless the optional `webExVeActive` config value
  (`SecurityPolicyConfig`) is `false`; `undefined`, `null` and `true` include
  them. All Web Experimentation sources are omitted without a configured
  Web Experimentation project, regardless of `webExVeActive`. Hosts must pass their own base sources (`'self'`,
  `'unsafe-inline'`, `data:`) for the directives that get emitted.
- Next.js development HMR may additionally require `ws:`/`wss:` in the host
  application's `connect-src`; those development sources are not added to
  production policy output.

## Subpath exports

| Export | Contents |
| --- | --- |
| `.` | core integration |
| `./api` | API route helpers |
| `./client` | client-side components |
| `./data-platform/server` | Server-only Data Platform client and form-submission helper |
| `./feature-experimentation/server` | Server-only Feature Experimentation decisions, datafile cache and proxy route handlers |
| `./security` | Resource hints and CSP/COOP header helpers |
| `./server` | server-side utilities |
