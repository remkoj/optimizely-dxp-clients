# Next.JS Optimizely One toolkit <!-- omit in toc -->

> [!WARNING]
> There'll be an update of Optimizely SaaS CMS that is incompatible with all SDK versions prior to 5.1.6. If you don't upgrade, you will see empty pages (main website) and "Component not found" messages (preview).

React components (both client & server) to integrate the browser-side products from Optimizely (Web Experimentation, Data Platform & Content Analytics / Recommendations)

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
- [3. Usage](#3-usage)
  - [3.1. Optimizely One Gadget](#31-optimizely-one-gadget)
  - [3.2. Selecting the Web Experimentation project in browser](#32-selecting-the-web-experimentation-project-in-browser)


## 1. Requirements
- Next.JS 14.2+
- TypeScript 5+
- Access to the Optimizely One Products

## 2. Installation & Configuration

Start by adding the package to your project:
`yarn add @remkoj/optimizely-one-nextjs`

### 2.1. Add API Routes
Then make the service endpoints available by creating a new API route within Next.JS. For the app router this is done by creating this file:

`app/api/me/[[...path]]/route.ts`

Put the following code in this file to use the API Route handler from the package:

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

### 2.2. Add Provider & PageTracker to your layout
Within the global layout (or your ["third party providers component"](https://vercel.com/guides/react-context-state-management-nextjs#rendering-third-party-context-providers-in-server-components), whatever applies best), add the Optimizely One Scripts (`Scripts.Header` & `Scripts.Footer`), Context Provider (`OptimizelyOneProvider`), Page Activator (`PageActivator`), and - if you want to - the demo gadget (`OptimizelyOneGadget`).

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

### 2.4. Enable session cookie for Visitor ID
Within your middleware (`src/middleware.ts`), use the Session to make sure each visitor gets a unique Visitor ID. Either create this middleware within your project or add this logic to it.

```typescript
import { NextResponse, type NextRequest } from "next/server"
import { Session } from '@remkoj/optimizely-one-nextjs/api'

export function middleware(request: NextRequest)
{
    // Get the response
    const response = NextResponse.next()
    
    // Inject the Visitor ID cookie, with a sliding expiry
    const visitorId = Session.getOrCreateVisitorId(request)
    Session.addVisitorId(response, visitorId)

    // Return the response
    return response
}

export const config = {
    matcher: [
      // Skip all internal paths and paths with a '.'
      '/((?!.*\\.|ui|api|assets|_next\\/static|_next\\/image|_vercel).*)',
    ]
}
```

### 2.5. Configuration
The Optimizely One Integration is configured by setting the appropriate environment variables. 

#### 2.5.1. Prevent key leakage and unauthorized access
These environment variables must ***never*** be, consider them compromised when 
1. Comitted into your source control system. Set them using the method available on your hosting environment.
2. Configured to be exposed to the browser

Locally, you may use a `.env.local` file, which must be added to the ignore list of you source control system.

#### 2.5.2. List of supported environment variables
| Product | Environment Variable | Default Value | Purpose |
| - | - | - | - |
| *Global* | OPTIMIZELY_ONE_HELPER | 0 | Set to "1" to enable the Optimizely One Demo tools.<br/>- Allow overriding of the WebEx project ID through the 'pid' query string parameter <br/>- Enable the `<OptimizelyOneGadget />` component. 
| *Global* | OPTIMIZELY_DEBUG | 0 | Set to "1" to enable debugging output. ***Note:*** This setting is shared across the different packages - it will enable debug mode for all of them |
| *Global* | OPTIMIZELY_FRONTEND_COOKIE | visitorId | The cookie used to track the current Visitor ID |
| Data Platform | OPTIMIZELY_DATAPLATFORM_ID | | The public or private key of your ODP instance, use the private key to enable fetching of visitor behaviour / profile information |
| Data Platform | OPTIMIZLEY_DATAPLATFORM_ENDPOINT | https://api.zaius.com/ | The endpoint used to read data from ODP |
| Data Platform | OPTIMIZELY_DATAPLATFORM_BATCH_SIZE | 25 | The maximum number of items to fetch in one request, if there are more results, paging will be used to get the full data set |
| Content Intelligence & Recommendations | OPTIMIZELY_CONTENTRECS_CLIENT | | The client ID for Content Intelligence & Recommendations |
| Content Intelligence & Recommendations | OPTIMIZELY_CONTENTRECS_DELIVERY | 0 | The Delivery ID setup in the main tracking script |
| Content Intelligence & Recommendations | OPTIMIZELY_CONTENTRECS_DELIVERY_KEY | | The Delivery Key used to fetch visitor topic and goal information |
| Content Intelligence & Recommendations | OPTIMIZELY_CONTENTRECS_DOMAIN | idio.co | The main domain used for the Content Recs instance, without the prefix (such as "manager", "s", "api", etc...) |
| Web Experimentation | OPTIMIZELY_WEB_EXPERIMENTATION_PROJECT | | The project identifier of the Web Experimentation Project |

## 3. Usage
When leveraging the components and structure from the installation, everything should work immediately.

### 3.1. Optimizely One Gadget
The OptimizelyOneGadget will only show if the following two criteria have been met, this ensures that the gadget is only available when it has intentionally ben enabled:
 1. The environment variable `OPTIMIZELY_ONE_HELPER` has been set to "1"
 2. A test-cookie has been added to the browser using the 'Add test cookie' feature of the [Optimizely Assistant Chrome Add-On](https://support.optimizely.com/hc/en-us/articles/4410289500301-Optimizely-Experimentation-Assistant-Chrome-extension)

Using the Optimizely One Gadget it is possible to demonstrate the in-session behaviour tracking and analysis performed by the configured Optimizely products.

### 3.2. Selecting the Web Experimentation project in browser
When the `OPTIMIZELY_ONE_HELPER` is set to "1" - or the Scripts.Header component has been instructed to do so explicitly - it is possible to change the Optimizely Web Experimentation project on the fly. This is done by adding a query string parameter `?pid=`, with the new project id.

The project id is persisted in localStorage with the key `_pid` and needs to be removed manually to revert back to the configured Web Experimentation project.
