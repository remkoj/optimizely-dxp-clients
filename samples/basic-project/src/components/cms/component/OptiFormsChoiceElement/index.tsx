import { CmsEditable, type CmsComponent } from "@remkoj/optimizely-cms-react/rsc";
import { OptiFormsChoiceElementDataFragmentDoc, type OptiFormsChoiceElementDataFragment } from "@/gql/graphql";

/**
 * Multiple or single choice
 * ---
 * 
 */
export const OptiFormsChoiceElementComponent : CmsComponent<OptiFormsChoiceElementDataFragment> = ({ data, editProps }) => {
    const componentName = 'Multiple or single choice'
    const componentInfo = ''
    return <CmsEditable className="w-full border-y border-y-solid border-y-slate-900 py-2 mb-4" {...editProps}>
        <div className="font-bold italic">{ componentName }</div>
        <div>{ componentInfo }</div>
        { Object.getOwnPropertyNames(data).length > 0 && <pre className="w-full overflow-x-hidden font-mono text-sm bg-slate-200 p-2 rounded-sm border border-solid border-slate-900 text-slate-900">{ JSON.stringify(data, undefined, 4) }</pre> }
    </CmsEditable>
}
OptiFormsChoiceElementComponent.displayName = "Multiple or single choice (_component/OptiFormsChoiceElement)"
OptiFormsChoiceElementComponent.getDataFragment = () => ['OptiFormsChoiceElementData', OptiFormsChoiceElementDataFragmentDoc]

export default OptiFormsChoiceElementComponent