# @remkoj/optimizely-cms-react — usage

React and React Server Component (RSC) integration library for Optimizely CMS.

## Install

```bash
npm install @remkoj/optimizely-cms-react
```

## Subpath exports

| Import path | Contents |
| --- | --- |
| `@remkoj/optimizely-cms-react` | Client components, factory, core types |
| `@remkoj/optimizely-cms-react/rsc` | Server Components: `CmsContent`, `CmsContentArea`, `CmsEditable`, `ServerContext`, `OptimizelyComposition`, node helpers |
| `@remkoj/optimizely-cms-react/utils` | Shared utilities |

## Key types

```typescript
import type { CmsComponent, CmsComponentProps, ContentType, ComponentTypeDictionary } from '@remkoj/optimizely-cms-react'

// A CMS-aware React component
type CmsComponent<TData, TLayoutProps = Record<string, any>> =
  React.ComponentType<CmsComponentProps<TData, TLayoutProps>>

// Props injected into every CMS component
type CmsComponentProps<TData, TLayoutProps> = {
  contentLink: ContentLinkWithLocale
  data: TData
  inEditMode?: boolean       // true when rendering inside On-Page Editor
  layoutProps?: TLayoutProps
  editProps?: ComponentCmsEditableProps
  ctx?: GenericContext
}

// For Section/layout components that receive child nodes from Visual Builder
// children is also available on CmsComponentProps
```

## Component factory

```typescript
import { DefaultComponentFactory, RichTextComponentDictionary } from '@remkoj/optimizely-cms-react/rsc'
import type { ComponentTypeDictionary } from '@remkoj/optimizely-cms-react'

// Build a flat dictionary to pass to registerAll
export const myComponents: ComponentTypeDictionary = [
  { type: 'HeroBlock', component: HeroBlockComponent },
  // ...
]

// Create and populate the factory (server-only — wrap in 'server-only' import)
const factory = new DefaultComponentFactory()
factory.registerAll(RichTextComponentDictionary) // register built-in rich text nodes
factory.registerAll(myComponents)
```

## RSC components (import from `./rsc`)

```typescript
import {
  CmsContent,
  CmsContentArea,
  CmsEditable,
  RichText,
  ServerContext,
  OptimizelyComposition,
  isNode,
  isComponentNode,
  isStructureNode,
} from '@remkoj/optimizely-cms-react/rsc'

// Render a single content item by content link
<CmsContent contentLink={{ key: content._metadata.key, locale: 'en' }} ctx={ctx} />

// Render a content area (list of content items)
<CmsContentArea fieldName="MainContentArea" items={content.MainContentArea} ctx={ctx} />

// Wrap editable regions in OPE — cmsId marks the content item, cmsFieldName marks individual fields
<CmsEditable as="section" cmsId={contentLink.key} ctx={ctx}>...</CmsEditable>
<CmsEditable as="h1" cmsFieldName="Heading" ctx={ctx}>{heading}</CmsEditable>

// Render Visual Builder experience compositions
const composition = getFragmentData(ExperienceDataFragmentDoc, data).composition
if (composition && isNode(composition))
  return <OptimizelyComposition node={composition} ctx={ctx} />
```

## ServerContext

Create once per request (e.g. in the root layout) and pass as `ctx` to all CMS components.

```typescript
import 'server-only'
import { ServerContext } from '@remkoj/optimizely-cms-react/rsc'
import { createClient } from '@remkoj/optimizely-graph-client'

const client = createClient(undefined, undefined, { nextJsFetchDirectives: true, cache: true, queryCache: true })
const ctx = new ServerContext({ locale: 'en', factory, client })
```

`ServerContext` exposes `client`, `factory`, `locale`, `inEditMode`, `inPreviewMode`, `isDevelopment`, `isDebug`.

## Component patterns

### Block / Component

```typescript
import { type CmsComponent } from '@remkoj/optimizely-cms-react'
import { CmsEditable } from '@remkoj/optimizely-cms-react/rsc'
import { MyBlockDataFragmentDoc, type MyBlockDataFragment } from '@/gql/graphql'

export const MyBlock: CmsComponent<MyBlockDataFragment> = ({ data, contentLink, inEditMode, ctx }) => {
  return <CmsEditable as="section" cmsId={contentLink.key} ctx={ctx}>...</CmsEditable>
}
MyBlock.displayName = 'My Block (Component/MyBlock)'
MyBlock.getDataFragment = () => ['MyBlockData', MyBlockDataFragmentDoc]
```

### Page

```typescript
import { type OptimizelyNextPage } from '@remkoj/optimizely-cms-nextjs'
import { MyPageDataFragmentDoc, type MyPageDataFragment } from '@/gql/graphql'

export const MyPage: OptimizelyNextPage<MyPageDataFragment> = ({ data, ctx }) => { ... }
MyPage.getDataFragment = () => ['MyPageData', MyPageDataFragmentDoc]
MyPage.getMetaData = async (contentLink, locale, client) => ({ title: '...' })
```

### Section (Visual Builder layout node)

Section components receive `children` (rendered child nodes) and `layoutProps` (display template data).

```typescript
import { type CmsComponent } from '@remkoj/optimizely-cms-react'
import { CmsEditable } from '@remkoj/optimizely-cms-react/rsc'

export const MySection: CmsComponent<MySectionDataFragment, MyLayoutProps> = ({ contentLink, layoutProps, children, ctx }) => {
  return <CmsEditable as="div" cmsId={contentLink.key} ctx={ctx}>{children}</CmsEditable>
}
MySection.getDataFragment = () => ['MySectionData', MySectionDataFragmentDoc]
```

### Experience

```typescript
if (ctx) ctx.editableContentIsExperience = true
const composition = getFragmentData(ExperienceDataFragmentDoc, data).composition
return <div>{composition && isNode(composition) && <OptimizelyComposition node={composition} ctx={ctx} />}</div>
```

## Utilities (import from `./utils`)

```typescript
import { Utils } from '@remkoj/optimizely-cms-react'
// or
import { isNonEmptyString, slugify } from '@remkoj/optimizely-cms-react/utils'
```

## Constraints

- RSC components (`./rsc`) are server-only; do not import in client components.
- Always pass `ctx` down from layout to leaf components; components warn at runtime when `ctx` is missing.
- `ContentLink` and `ContentLinkWithLocale` are re-exported from `@remkoj/optimizely-graph-client` (direct import preferred).
- `RichTextComponentDictionary` must be registered on the factory before passing it to `ServerContext`.
