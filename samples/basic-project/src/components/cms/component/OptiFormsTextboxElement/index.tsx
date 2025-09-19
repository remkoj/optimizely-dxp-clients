import { CmsEditable, type CmsComponent } from "@remkoj/optimizely-cms-react/rsc";
import { OptiFormsTextboxElementDataFragmentDoc, type OptiFormsTextboxElementDataFragment } from "@/gql/graphql";
import ClientTextBox from "./_client"

/**
 * Textbox
 * 
 */
export const OptiFormsTextboxElement_component : CmsComponent<OptiFormsTextboxElementDataFragment> = ({ data, editProps }) => {
  const componentName = 'Textbox'
  const componentInfo = ''
  return <CmsEditable style={{ display: "flex", flexDirection: "column"}} {...editProps}>
    <ClientTextBox data={data} />
  </CmsEditable>
}
OptiFormsTextboxElement_component.displayName = "Textbox (_component/OptiFormsTextboxElement)"
OptiFormsTextboxElement_component.getDataFragment = () => ['OptiFormsTextboxElementData', OptiFormsTextboxElementDataFragmentDoc]

export default OptiFormsTextboxElement_component