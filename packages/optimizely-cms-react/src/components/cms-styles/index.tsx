/**
 * A Visual Builder style, describing a selectable template for an element,
 * base type or node type
 */
export type StyleDefinition<TN extends string = string> = {
  key: string
  displayName: string
  isDefault: boolean
  settings: Record<string, StyleSetting>
} & (ElementStyleDefinition<TN> | BaseStyleDefinition<TN> | NodeStyleDefinition<TN>)

/**
 * A `StyleDefinition` that applies to a specific content type
 */
export type ElementStyleDefinition<TN extends string> = {
  contentType: TN
}

/**
 * A `StyleDefinition` that applies to a base type (e.g. `_component`, `_page`)
 */
export type BaseStyleDefinition<TN extends string> = {
  baseType: TN,
}

/**
 * A `StyleDefinition` that applies to a Visual Builder node type
 */
export type NodeStyleDefinition<TN extends string> = {
  nodeType: TN,
}

/**
 * A single configurable setting exposed by a `StyleDefinition`
 */
export type StyleSetting = {
  displayName: string
  sortOrder: number
  editor?: string
  choices: Record<string, { displayName: string, sortOrder: number }>
}

/**
 * The layout properties, as received from Optimizely Graph, describing the
 * style and settings applied to a Visual Builder node
 */
export type LayoutProps<T extends StyleDefinition<string> = StyleDefinition<string>> = {
  type: T extends ElementStyleDefinition<infer TN> ? TN : (T extends BaseStyleDefinition<infer TN> ? TN : (T extends NodeStyleDefinition<infer TN> ? TN : null)),
  layoutType: string,
  template: T['key'] | null,
  settings: LayoutPropsSetting<T['settings']>[]
}

/**
 * A single resolved setting key/value pair within `LayoutProps`
 */
export type LayoutPropsSetting<T extends Record<string, StyleSetting>, K extends keyof T = keyof T> = LayoutPropsSettingChoices<T>[K]

/**
 * Maps each setting of a `StyleDefinition` to its key and possible choice values
 */
export type LayoutPropsSettingChoices<T extends Record<string, StyleSetting>> = {
  [K in keyof T] : { key: K, value: keyof T[K]['choices']} 
}

/**
 * The union of all setting keys available within a given `LayoutProps`
 */
export type LayoutPropsSettingKeys<CL extends LayoutProps> = CL['settings'][number]['key']

/**
 * The value type for a given setting key within a `LayoutProps`
 */
export type LayoutPropsSettingValues<CL extends LayoutProps, K extends LayoutPropsSettingKeys<CL>> = Extract<CL['settings'][number], { key: K }>['value']

/**
 * Read a configured layout setting from Style properties retrieved through Optimizely Graph
 * 
 * @param   from            The Layout Settings as provided for Visual Builder rendered elements
 * @param   settingName     The name of the setting to retrieve the value for
 * @param   defaultValue    THe default value for when the setting is missing or not set
 * @returns The setting value
 */
export function readSetting<
  T extends LayoutProps, 
  F extends LayoutPropsSettingKeys<T>, 
  DV extends LayoutPropsSettingValues<T, F> | undefined
>(from: T | undefined, settingName: F, defaultValue?: DV) : DV extends undefined ? (LayoutPropsSettingValues<T, F> | undefined) : Exclude<LayoutPropsSettingValues<T, F>, undefined>
{
  type RT = DV extends undefined ? (LayoutPropsSettingValues<T, F> | undefined) : Exclude<LayoutPropsSettingValues<T, F>, undefined>
  const rv = from?.settings?.filter(x => x.key == settingName)[0]?.value
  return (rv || defaultValue) as RT
}

export function extractSettings<T extends LayoutProps>(from: T | undefined) : Partial<{ [ K in LayoutPropsSettingKeys<T> ]: LayoutPropsSettingValues<T, K> }>
{
  type RT = Partial<{ [ K in LayoutPropsSettingKeys<T> ]: LayoutPropsSettingValues<T, K> }>
  if (!from)
    return {} as RT
  const extracted = from.settings?.reduce((acc, itm) => {
    if (itm.value)
      acc[itm.key as keyof RT] = itm.value as RT[keyof RT]
    return acc
  }, {} as RT)
  return extracted || {} as RT
}