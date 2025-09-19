import { type OptimizelyNextPage as CmsComponent } from "@remkoj/optimizely-cms-nextjs";
import { ExperienceDataFragmentDoc, getBlankExperienceDataDocument, type getBlankExperienceDataQuery } from '@/gql/graphql'
import { getFragmentData } from '@/gql/fragment-masking'
import { OptimizelyComposition, isNode, CmsEditable } from "@remkoj/optimizely-cms-react/rsc";
import { getSdk } from "@/gql/client"

/**
 * Blank Experience
 * ---
 * An experience without a predefined layout.
 * 
 * This component uses the content query that is auto-generated with the Optimizely CMS Preset for GraphQL Codegen, if you need 
 * to override this query create the file `BlankExperience.query.graphql` in the same folder as this file. This file then
 * must include a GraphQL query with the name `getBlankExperience Data`. 
 * 
 * [Documentation: Customizing queries](https://github.com/remkoj/optimizely-dxp-clients/blob/main/packages/optimizely-graph-functions/docs/customizing_queries.md)
 */
export const BlankExperienceExperience : CmsComponent<getBlankExperienceDataQuery> = ({ data, ctx }) => {
  if (ctx) ctx.editableContentIsExperience = true
  const composition = getFragmentData(ExperienceDataFragmentDoc, data).composition
  const componentName = 'Blank Experience'
  const componentInfo = 'An experience without a predefined layout.'
  return <CmsEditable as="div" className="mx-auto px-2 container" cmsFieldName="unstructuredData" ctx={ctx}>
      <div className="font-bold italic">{ componentName }</div>
      <div>{ componentInfo }</div>
      { composition && isNode(composition) && <OptimizelyComposition node={composition} ctx={ctx} /> }
  </CmsEditable>
}
BlankExperienceExperience.displayName = "Blank Experience (_experience/BlankExperience)"
BlankExperienceExperience.getDataQuery = () => getBlankExperienceDataDocument
BlankExperienceExperience.getMetaData = async (contentLink, locale, client) => {
    const sdk = getSdk(client);
    // Add your metadata logic here
    return {}
}

export default BlankExperienceExperience