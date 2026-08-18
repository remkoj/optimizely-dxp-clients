// Export library
/**
 * Error classes thrown by the Optimizely DXP React SDK
 */
export * as Errors from './errors.js'
/**
 * General purpose utility functions used throughout the Optimizely DXP React SDK
 */
export * as Utils from './utilities.js'
export * from './types.js'
export * from './factory/index.js'
export * from './context/types.js'

// Export React Server Components
export * from './context/rsc.js'
export * from './components/rsc.js'
/**
 * RSC component exports, including `CmsEditable`, `CmsContent`,
 * `CmsContentArea` and their prop types.
 *
 * `CmsContent` usage:
 *
 * ```tsx
 * import { CmsContent } from '@remkoj/optimizely-cms-react/rsc'
 *
 * <CmsContent contentLink={{ key: content._metadata.key, locale: 'en' }} />
 * ```
 *
 * `CmsContentArea` usage:
 *
 * ```tsx
 * import { CmsContentArea } from '@remkoj/optimizely-cms-react/rsc'
 *
 * <CmsContentArea
 *   items={content.MainContentArea}
 *   fieldName="MainContentArea"
 *   as="section"
 * />
 * ```
 */
export * from './components/rsc-components.js'
export * from './rsc-utilities.js'
