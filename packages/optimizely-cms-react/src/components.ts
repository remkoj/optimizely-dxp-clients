/**
 * @deprecated The `@remkoj/optimizely-cms-react/components` export has been deprecated
 */


import { RichText as BaseRichText } from "./components/rich-text/index.js"
import { serverContextAware } from "./rsc.js"
/**
 * @deprecated The `@remkoj/optimizely-cms-react/components` export has been
 *             deprecated, use either `@remkoj/optimizely-cms-react` or
 *             `@remkoj/optimizely-cms-react/rsc`, dependingn on your context
 */
export const RichText = serverContextAware(BaseRichText)
/**
 * @deprecated The `@remkoj/optimizely-cms-react/components` export has been deprecated
 */
export { DefaultComponents, DefaultTextNode, createHtmlComponent } from "./components/rich-text/components.js"
/**
 * @deprecated The `@remkoj/optimizely-cms-react/components` export has been deprecated
 */
export * as Utils from "./components/rich-text/utils.js"
/**
 * @deprecated The `@remkoj/optimizely-cms-react/components` export has been deprecated
 */
export type * from "./components/rich-text/types.js"
/**
 * @deprecated The `@remkoj/optimizely-cms-react/components` export has been deprecated
 */
export type { BaseStyleDefinition, ElementStyleDefinition, LayoutProps, LayoutPropsSetting, LayoutPropsSettingChoices, LayoutPropsSettingKeys, LayoutPropsSettingValues, NodeStyleDefinition, StyleDefinition, StyleSetting } from "./components/cms-styles/index.js"
/**
 * @deprecated The `@remkoj/optimizely-cms-react/components` export has been deprecated
 */
export { extractSettings, readSetting } from "./components/cms-styles/index.js"