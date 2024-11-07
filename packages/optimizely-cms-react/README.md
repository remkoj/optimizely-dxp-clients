# Optimizely SaaS CMS React Components
> [!WARNING]
> This documentation is for V3 and up. This version introduced a number of breaking changes - most notably it significantly simplified the exports.
>
> For some of the commonly used old exports it still contains placeholders, however those are deprecated and will be removed in a future version

This package provides two main entry points, depending on your build environment:
- `@remkoj/optimizely-cms-react` This export contains the library, whith React components that use a client side context
- `@remkoj/optimizely-cms-react/rsc` This export contains the library, whith React components that use a server side context

## Components & Functions
### Shared components & functions
Regardless of which export you're using, the following components are available. The properties of each component are document using JSDoc annotations in the package.

| Component/Function | Description |
| --- | --- |
| `<CmsContent {...props} />` | This component renders a content item from the Optimizely CMS.<br/>It leverages the factory provided by the context to resolve the Optimizely CMS type to a React Component.<br/>When no, or invalid, initial data is provided, this component will use the connection to Optimizely Graph from the context to fetch the data for the component.<br/><br/>The CmsComponent has two specific properties that enable an implementor to control the component resolution:<br/>- `contentTypePrefix`: Enforce the prefix of the content type, for example 'component', which will ensure that the component will be resolved as 'component'.<br/>- `variant`: Allows setting of a preferred postfix of the content type, but will fall-back to the main component if not found in the factory.<br/>- `noDataLoad`: When set to `true`, it will not load data - even when omitted. |
| `<CmsContentArea {...props} />` | A helper component to quickly and easily render the contents of a Content Area type property in Optimizely CMS.<br /><br />The Content Area leverages the `<CmsContent />` internally to render each item contained within the area. It ensures that the prefix is `component`, forcing a different component to be used when a "non-component" (e.g. a page) is added to the content-area |
| `<CmsEditable {...props} />` | This is a basic wrapper that performs the logic needed to inject the appropriate attributes into the HTML. <br/>It will use a `div` element by default for that, but you can set any React component to be used on the `as` property. The only requirement is that the property set for this accepts the `data-*` attributes injected and outputs these into the page. Any additional attributes will be passed to the output component. |
| `<RichText {...props} />` | This is a renderer for the structured HTML output of Optimizely CMS, leveraging the `ComponentFactory` to resolve the actual React components used for the output. It prefixes all types with `RichText`<br/>The library exports a `DefaultComponents` constant, which can be used to populate the ComponentFactory with the basic HTML elements |
| `<OptimizelyComposition {...props} />` | This is the renderer for a Visual Builder Experience. This will render the composition using the `ComponentFactory` from the context and `<CmsContent />` component.<br/><br/>The style definitions of Visual Builder will be provided to the `layoutProps` property of your CmsComponent |

### Server Side components & functions
In addition to the components above, the following methods are available in the `@remkoj/optimizely-cms-react/rsc` export only:

| Component / Function | Description |
| --- | --- |
| `getServerContext()` | Retrieve the current server context in use, this leverages `React.cache` to ensure a single context is used within the cache scope defined by your React Server implementation |
| `isDebug()` | Test if the environment variables flag the current environment to be in debug mode. |
| `isDevelopment()` | Test if the environment variables flag the current environment to be a developer environment. |

### Client Side components & functions
In addition to the components above, the following methods are available in the `@remkoj/optimizely-cms-react` export only:

| Component / Function | Description |
| --- | --- |
| `<OptimizelyCms {...props} />` | React context to be used client side, without defaults. This needs to be initialized completely by your code. |
| `useOptimizelyCms()` | React Hook to retrieve the current Optimizely CMS Context in your client-side component. |
