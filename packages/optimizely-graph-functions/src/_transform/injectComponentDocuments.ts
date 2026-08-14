import type { Types } from '@graphql-codegen/plugin-helpers'
import { DocumentGenerator, VirtualLocation } from '../generator'
import * as OptiCMS from '../cms'
import { isNotNullOrUndefined } from '../utils'

/**
 * Build the list of custom document loader entries for all CMS-managed component
 * content types. Each entry points to the `ContentTypeLoader` which generates the
 * corresponding GraphQL fragment on demand.
 *
 * Property-typed component references are also included so their fragments are
 * available when building parent fragments.
 *
 * @param loader  The loader module path passed to the codegen runner. Defaults to the
 *                built-in `@remkoj/optimizely-graph-functions/contenttype-loader`.
 */
export async function getComponentDocuments(loader: string = '@remkoj/optimizely-graph-functions/contenttype-loader')
{
  const componentTypes = await OptiCMS.getContentTypesList(undefined, (ct) => {
    if (!ct.key) // The key is required
      return false;
    if (ct.source === 'graph' || ct.source === 'globalcontract' || ct.source === '_system') // Only CMS managed types are allowed
      return false;
    if (ct.isContract) // Contracts must be ignored
      return false;
    return true;
  });

  const documents: Types.CustomDocumentLoader[] = [];
  for (const componentType of componentTypes) {
    const vLoc = VirtualLocation.build(componentType, { type: 'fragment', forProperty: false })
    if (vLoc) {
      // Inject virtual location
      const def: Types.CustomDocumentLoader = {}
      def[vLoc] = { loader };
      documents.push(def);

      // Get properties
      const propertyComponentTypeNames = DocumentGenerator.getReferencedPropertyComponents(componentType);
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
  }
  return documents;
}

/**
 * Build the list of custom document loader entries for all known injection targets
 * (e.g. `PageData`, `BlockData`, `ComponentData`). Each entry produces an empty
 * placeholder fragment that component fragments are later injected into.
 *
 * @param loader  The loader module path. Defaults to the built-in `ContentTypeLoader`.
 */
export async function getInjectionTargetDocuments(loader: string = '@remkoj/optimizely-graph-functions/contenttype-loader')
{
  const documents: Types.CustomDocumentLoader[] = [];
  for (const injectionTarget of VirtualLocation.getInjectionTargets()) {
    const vLoc = VirtualLocation.build(injectionTarget)
    const def: Types.CustomDocumentLoader = {}
    def[vLoc] = { loader };
    documents.push(def);
  }
  return documents
}
