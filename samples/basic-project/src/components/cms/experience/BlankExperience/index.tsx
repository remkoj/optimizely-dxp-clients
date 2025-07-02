import { type OptimizelyNextPage as CmsComponent } from '@remkoj/optimizely-cms-nextjs'
import { getFragmentData } from '@/gql/fragment-masking'
import {
  ExperienceDataFragmentDoc,
  CompositionDataFragmentDoc,
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
> = ({ data, contentLink }) => {
  const composition = getFragmentData(
    CompositionDataFragmentDoc,
    getFragmentData(ExperienceDataFragmentDoc, data)?.composition
  )
  return (
    <CmsEditable
      as="div"
      className="mx-auto px-2 container"
      cmsFieldName="unstructuredData"
    >
      <pre>{JSON.stringify(contentLink)}</pre>
      {composition && isNode(composition) && (
        <OptimizelyComposition node={composition} />
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
