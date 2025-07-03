import { type OptimizelyNextPage as CmsComponent } from '@remkoj/optimizely-cms-nextjs'
import { getFragmentData } from '@/gql/fragment-masking'
import {
  ExperienceDataFragmentDoc,
  BlankExperienceDataFragmentDoc,
  type BlankExperienceDataFragment,
} from '@/gql/graphql'
import {
  OptimizelyComposition,
  isNode,
  CmsEditable,
} from '@remkoj/optimizely-cms-react/rsc'
import { getSdk } from '@/gql'

/**
 * Blank Experience
 * An experience without a predefined layout.
 */
export const BlankExperienceExperience: CmsComponent<
  BlankExperienceDataFragment
> = ({ data, contentLink, ctx }) => {
  if (ctx) ctx.editableContentIsExperience = true
  const composition = getFragmentData(
    ExperienceDataFragmentDoc,
    data
  ).composition

  return (
    <CmsEditable
      as="div"
      className="mx-auto px-2 container"
      cmsFieldName="unstructuredData"
      ctx={ctx}
    >
      <h1>
        {contentLink.key} ({contentLink.version})
      </h1>
      <pre>{JSON.stringify(contentLink, undefined, 4)}</pre>
      {composition && isNode(composition) && (
        <OptimizelyComposition node={composition} ctx={ctx} />
      )}
    </CmsEditable>
  )
}
BlankExperienceExperience.displayName =
  'Blank Experience (Experience/BlankExperience)'
BlankExperienceExperience.getDataFragment = () => [
  'BlankExperienceData',
  BlankExperienceDataFragmentDoc,
]
BlankExperienceExperience.getMetaData = async (contentLink, locale, client) => {
  const sdk = getSdk(client)
  // Add your metadata logic here
  return {}
}

export default BlankExperienceExperience
