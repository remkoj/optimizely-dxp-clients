import type { Types } from '@graphql-codegen/plugin-helpers'
import * as OptiCMS from '../cms'
import { VirtualLocation } from '../generator'

/**
 * Build the list of custom document loader entries for all CMS-managed section
 * content types. Sections get both a get-query and a data fragment entry so
 * they can be used as standalone pages and as composition nodes.
 *
 * @param loader  The loader module path. Defaults to the built-in `ContentTypeLoader`.
 */
export async function getSectionDocuments(loader: string = '@remkoj/optimizely-graph-functions/contenttype-loader')
{
  const sectionTypes = OptiCMS.getContentTypesList(undefined, (ct) => {
    if (ct.source == "graph")
      return false;
    return ["_section"].includes((ct.baseType || "").toLowerCase());
  });

  const documents: Types.CustomDocumentLoader[] = [];
  for (const sectionType of await sectionTypes) {
    const vLoc = VirtualLocation.build(sectionType, { type: 'query' })
    if (vLoc) {
      const def: Types.CustomDocumentLoader = {}
      def[vLoc] = { loader }
      documents.push(def);
    }
    const fragmentVLoc = VirtualLocation.build(sectionType, { type: 'fragment' })
    if (fragmentVLoc) {
      const def: Types.CustomDocumentLoader = {}
      def[fragmentVLoc] = { loader }
      documents.push(def);
    }
  }
  return documents;
}
