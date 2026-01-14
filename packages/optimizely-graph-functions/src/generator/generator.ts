import { type IntegrationApi } from '@remkoj/optimizely-cms-api'
import { ucFirst, isNonEmptyString } from '../tools'

/**
 * Generate GraphQL fragments and queries for Optimizely Graph,
 * based upon the content type definitions within an Optimizely
 * CMS instance.
 */
export class DocumentGenerator
{
  protected _allContentTypes: Map<string, IntegrationApi.ContentType>;

  public constructor(allContentTypes?: Map<string, IntegrationApi.ContentType>)
  {
    this._allContentTypes = allContentTypes ?? new Map()
  }

  /**
   * Get the Graph Type for the Content Type, this imitates the logic
   * within Optimizely CMS to transform a ContentType key into a type
   * within Optimizely Graph.
   * 
   * @param contentType 
   * @returns 
   */
  public getGraphType(contentType: IntegrationApi.ContentType | string): string {
    const itemKey = (isNonEmptyString(contentType) ? contentType : contentType?.key) ?? "_IContent"
    return itemKey;
  }

  /**
   * Get the Graph Type for the Content Type, when it's used as a property,
   * this imitates the logic within Optimizely CMS to transform a ContentType 
   * key into a type within Optimizely Graph.
   * 
   * @param contentType 
   * @returns 
   */
  public getGraphPropertyType(contentType: IntegrationApi.ContentType | string): string {
    return this.getGraphType(contentType) + "Property"
  }

  /**
   * Retrieve the default name for the data query for the given content type
   * 
   * @param contentType 
   * @returns 
   */
  public getDefaultQueryName(contentType: IntegrationApi.ContentType | string): string {
    const graphType = this.getGraphType(contentType)
    return `get${this.getSlugFromKey(graphType)}Data`;
  }

  /**
   * Retrieve the default name for the data fragment for the given content type
   * 
   * @param contentType 
   * @returns 
   */
  public getDefaultFragmentName(contentType: IntegrationApi.ContentType | string): string {
    const graphType = this.getGraphType(contentType)
    return this.getSlugFromKey(graphType) + "Data";
  }

  /**
   * Retrieve the default name for the fragment when the content type is used as 
   * property
   * 
   * @param contentType 
   * @returns 
   */
  public getDefaultPropertyFragmentName(contentType: IntegrationApi.ContentType | string): string {
    const graphPropertyType = this.getGraphPropertyType(contentType)
    return this.getSlugFromKey(graphPropertyType) + "Data"
  }

  private getSlugFromKey(key: string) {
    let newKey = key.startsWith('_') ? ucFirst(key.substring(1)) : key
    if (newKey.includes(":"))
      newKey = newKey.split(":").map(x => ucFirst(x)).join("")
    return newKey
  }

  /**
   * Build the GraphQL fragment that is used as injection target
   * 
   * @param injectionTarget 
   * @returns 
   */
  public buildInjectionTarget(injectionTarget: string) {
    return `fragment ${injectionTarget} on _IContent { ...IContentData }`
  }

  /**
   * Build a query to retrieve the data for a specific content type by identifier
   * 
   * @param contentType 
   * @param queryName 
   * @param propertyTracker 
   * @returns 
   */
  public buildGetQuery(contentType: IntegrationApi.ContentType, queryName?: string | ((defaultName: string) => string), propertyTracker: Map<string,string> = new Map()) {
    // Prepare
    if (!contentType.key || contentType.source === 'graph')
      return ''
    const graphType = this.getGraphType(contentType)
    const renderedQueryName = isNonEmptyString(queryName) ? queryName :
      (typeof queryName === 'function' ? 
        queryName(this.getDefaultQueryName(contentType)) :
        this.getDefaultQueryName(contentType))

    // Render properties
    const properties: (string | null)[] = [];
    for (const propName of Object.getOwnPropertyNames(contentType.properties ?? {}))
      properties.push(this.buildProperty(propName, (contentType.properties || {})[propName], propertyTracker));

    // Inject base type based defaults
    if (contentType.baseType === "_experience")
      properties.unshift("...ExperienceData")

    //Render query
    const query = `query ${renderedQueryName}($key: [String!]!, $locale: [Locales], $changeset: String, $variation: VariationInput, $version: String) {
    data: ${graphType}(
      ids: $key
      locale: $locale
      variation: $variation
      where: { _metadata: { changeset: { eq: $changeset }, version: { eq: $version } } }
    ) {
      total
      item {
        _metadata {
          key
          version
          locale
          changeset
          variation
        }
        ${properties.filter(isNonEmptyString).join("\n      ")}
      }
    }
  }`
    return query
  }

  public buildFragment(contentType: IntegrationApi.ContentType, fragmentName?: string | ((defaultName: string) => string), forProperty: boolean = false, propertyTracker: Map<string,string> = new Map()) {
    if (!contentType.key)
      return ''
    const graphType = forProperty ? this.getGraphPropertyType(contentType) : this.getGraphType(contentType);
    const defaultFragmentName = forProperty ? this.getDefaultPropertyFragmentName(contentType) : this.getDefaultFragmentName(contentType);
    const graphFragmentName = isNonEmptyString(fragmentName) ?
      fragmentName : (typeof fragmentName === 'function' ? fragmentName(defaultFragmentName) : defaultFragmentName);

    // Inject all properties
    const properties: (string | null)[] = [];
    for (const propName of Object.getOwnPropertyNames(contentType.properties ?? {}))
      properties.push(this.buildProperty(propName, (contentType.properties || {})[propName], propertyTracker));

    // Inject base type based defaults
    if (contentType.baseType === "_experience")
      properties.push("...ExperienceData")

    // Ensure that there's at least one property
    if (properties.length === 0)
      properties.unshift("__typename")

    // Construct fragment rawSDL
    return `fragment ${graphFragmentName} on ${graphType} {
    ${properties.filter(isNonEmptyString).join("\n  ")}
  }`
  }

  /**
   * Retrieve a list of component keys that are referenced as property by this type
   * 
   * @param contentType 
   * @returns 
   */
  public static getReferencedPropertyComponents(contentType: IntegrationApi.ContentType): string[] {
    const properties = contentType.properties
    if (!properties)
      return []

    return Object.getOwnPropertyNames(properties).reduce((referencedTypes, propertyKey) => {
      if (properties[propertyKey].type == "component" && properties[propertyKey].contentType) {
        referencedTypes.push(properties[propertyKey]?.contentType)
      }
      if (properties[propertyKey].type == "array" && properties[propertyKey].items?.type == "component" && properties[propertyKey].items?.contentType) {
        referencedTypes.push(properties[propertyKey]?.items?.contentType)
      }
      return referencedTypes
    }, [] as string[])
  }

  protected buildProperty(propertyName: string, propertyConfig?: IntegrationApi.ContentTypeProperty, propertyTracker: Map<string,string> = new Map()): string | null {
    // Get type information rendering
    const propertyItemConfig = propertyConfig?.type === 'array' ? propertyConfig?.items ?? propertyConfig : propertyConfig
    const propertyType = propertyItemConfig?.type ?? 'any'

    // Ensure we don't have property naming collisions
    let outputPropertyName = propertyName
    if (propertyTracker.has(propertyName)) {
      if (propertyTracker.get(propertyName) != propertyType) {
        outputPropertyName = `${propertyName}${ucFirst(propertyType)}: ${propertyName}`
        propertyTracker.set(`${propertyName}${ucFirst(propertyType)}`, propertyType)
      }
    } else {
      propertyTracker.set(propertyName, propertyType)
    }

    // Render property
    switch (propertyType) {
      case 'url':
        return outputPropertyName + " { type base default }"
      case 'content': {
        // Resolve allowed/restricted
        const allowedTypes: string[] = (propertyItemConfig?.allowedTypes ?? []);
        const restrictedTypes: string[] = (propertyItemConfig?.restrictedTypes ?? []);
        const pickFrom = allowedTypes.flatMap(tn => this.getTypeKeysFor(tn));
        const restrictBy = restrictedTypes.flatMap(tn => this.getTypeKeysFor(tn));

        // Prepare data
        const allowAny = pickFrom.length == 0 && restrictBy.length == 0;
        const spreads = new Set<string>();
        spreads.add('IContentData')
        if (allowAny) {
          ['BlockData','ComponentData'].forEach(x => spreads.add(x));
        } else {
          const base = pickFrom.length > 0 ? pickFrom : Array.from(this._allContentTypes.keys())
          const filtered = base.filter(x => !restrictBy.includes(x))
          filtered.forEach(typeName => spreads.add(this.getDefaultFragmentName(typeName)));
        }
        return `${ outputPropertyName } {\n      ${ Array.from(spreads).map(spread => `...${spread}`).join('\n      ') }    \n}`
      }
      case 'richText':
        return outputPropertyName + " { json }"
      case 'component': {
        const dataType = propertyItemConfig?.contentType
        if (!dataType)
          return null // Skip this property if the contentType isn't set
        return outputPropertyName + ` {  ...${dataType}PropertyData }`
      }
      case 'link':
        return outputPropertyName + ` {
      title
      text
      target
      url {
        type
        base
        default
      }
    }`;
      case 'contentReference': {
        return outputPropertyName + ` {
      key
      url {
        type
        base
        default
      }
      item @depend(on: "ContentReference.item") {
        __typename
        ...CmpImageAssetInfo
        ...CmpVideoAssetInfo
      }
    }`
      }
      default:
        return outputPropertyName
    }
  }

  protected getTypeKeysFor(contentTypeRestriction: string) {
    if (this._allContentTypes.size === 0)
      return contentTypeRestriction;

    const allTypes: string[] = [];

    // Add type if it exists
    if (this._allContentTypes.has(contentTypeRestriction))
      allTypes.push(contentTypeRestriction)

    // Add children
    this._allContentTypes.forEach(( contentType, contentTypeKey ) => {
      if (contentType.baseType === contentTypeRestriction) {
        const baseRestrictions = this.getTypeKeysFor(contentTypeKey)
        allTypes.push(...baseRestrictions)
      }
    })

    return allTypes;
  }
}
