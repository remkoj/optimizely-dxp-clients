import { CmsEditable, type CmsComponent } from "@remkoj/optimizely-cms-react/rsc";
import { OptiFormsContainerDataDataFragmentDoc, type OptiFormsContainerDataDataFragment } from "@/gql/graphql";

/**
 * Form Container
 * A structured block to manage form elements on a page.
 */
export const OptiFormsContainerDataSection : CmsComponent<OptiFormsContainerDataDataFragment> = ({ data, editProps, children }) => {
  return <CmsEditable {...editProps}>
    {data.Title && <h3>{data.Title}</h3>}
    {data.Description && <div>{data.Description}</div>}
    <form>{ children }</form>
  </CmsEditable>
}
OptiFormsContainerDataSection.displayName = "Form Container (_section/OptiFormsContainerData)"
OptiFormsContainerDataSection.getDataFragment = () => ['OptiFormsContainerDataData', OptiFormsContainerDataDataFragmentDoc]

export default OptiFormsContainerDataSection