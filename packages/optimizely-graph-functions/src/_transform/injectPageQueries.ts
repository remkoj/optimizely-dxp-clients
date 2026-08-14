import type { Types } from '@graphql-codegen/plugin-helpers'
import * as OptiCMS from '../cms'
import { isNotNullOrUndefined } from '../utils'
import { VirtualLocation, DocumentGenerator } from '../generator'

/**
 * Build the list of custom document loader entries for all CMS-managed page and
 * experience content types. Each entry points to the `ContentTypeLoader` which
 * generates the corresponding GraphQL get-query on demand.
 *
 * Property-typed component references are also included so their fragments are
 * available when building parent queries.
 *
 * @param loader  The loader module path. Defaults to the built-in `ContentTypeLoader`.
 */
export async function getPageDocuments(loader: string = '@remkoj/optimizely-graph-functions/contenttype-loader')
{
  const pageTypes = OptiCMS.getContentTypesList(undefined, (ct) => {
    if (ct.source == "graph")
      return false;
    return ["_page", "_experience"].includes((ct.baseType || "").toLowerCase());
  });

  const documents: Types.CustomDocumentLoader[] = [];
  for (const pageType of await pageTypes) {
    const vLoc = VirtualLocation.build(pageType, { type: 'query' })
    if (vLoc) {
      const def: Types.CustomDocumentLoader = {}
      def[vLoc] = { loader }
      documents.push(def);
    }
    
    // Get properties
    const propertyComponentTypeNames = DocumentGenerator.getReferencedPropertyComponents(pageType);
    const propertyComponentTypes = (await Promise.all(propertyComponentTypeNames.map(componentTypeName => OptiCMS.getContentType(componentTypeName)))).filter(isNotNullOrUndefined)
    for (const propertyComponentType of propertyComponentTypes) {
      const propVLoc = VirtualLocation.build(propertyComponentType, { type: 'fragment', forProperty: true })
      if (propVLoc && !documents.some(x => typeof x === 'object' && x[propVLoc])) {
        // Inject virtual location
        const def: Types.CustomDocumentLoader = {}
        def[propVLoc] = { loader };
        documents.push(def);
      }
    }
  }
  return documents;
}
