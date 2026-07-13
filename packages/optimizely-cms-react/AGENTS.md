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
| `@remkoj/optimizely-cms-react/rsc` | Server Components: `CmsContent`, `CmsContentArea`, `CmsEditable` |
| `@remkoj/optimizely-cms-react/utils` | Shared utilities |

## Key types

```typescript
import type { CmsComponent, CmsComponentProps, ContentType } from '@remkoj/optimizely-cms-react'

// A CMS-aware React component
type CmsComponent<TData, TLayoutProps = Record<string, any>> =
  React.ComponentType<CmsComponentProps<TData, TLayoutProps>>

// Props injected into every CMS component
type CmsComponentProps<TData, TLayoutProps> = {
  contentLink: ContentLinkWithLocale
  data: TData
  layoutProps?: TLayoutProps
  editProps?: ComponentCmsEditableProps
  ctx?: GenericContext
}
```

## RSC components (import from `./rsc`)

```typescript
import { CmsContent, CmsContentArea, CmsEditable } from '@remkoj/optimizely-cms-react/rsc'

// Render a single content item by content link
<CmsContent contentLink={{ key: content._metadata.key, locale: 'en' }} />

// Render a content area (list of content items)
<CmsContentArea items={content.mainContent} />

// Wrap editable regions in OPE
<CmsEditable cmsId={...} ctx={...}><YourComponent /></CmsEditable>
```

## Component factory

```typescript
import { ComponentFactory } from '@remkoj/optimizely-cms-react'

const factory = new ComponentFactory()
factory.register('MyContentType', MyComponent)
```

## Utilities (import from `./utils`)

```typescript
import { Utils } from '@remkoj/optimizely-cms-react'
// or
import { isNonEmptyString, slugify } from '@remkoj/optimizely-cms-react/utils'
```

## Constraints

- RSC components (`./rsc`) are server-only; do not import in client components.
- `ContentLink` and `ContentLinkWithLocale` are re-exported from `@remkoj/optimizely-graph-client` (direct import preferred).
