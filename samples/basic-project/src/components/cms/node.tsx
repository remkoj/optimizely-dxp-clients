import { CmsEditable, type CmsLayoutComponent } from '@remkoj/optimizely-cms-react/rsc'
import { type CSSProperties } from 'react';

export const VisualBuilderNode : CmsLayoutComponent = ({ editProps, layoutProps, children }) =>
{
  let className = `vb:${layoutProps?.layoutType}`;
  let style : CSSProperties | undefined = undefined;
  if (layoutProps?.layoutType == "row")
    style = {display: "flex", flexDirection: "row"}
  if (layoutProps?.layoutType == "column")
    style = {display: "flex", flexDirection: "column"}
  if (layoutProps && layoutProps.layoutType == "section")
    return <CmsEditable as="div" className={ className } {...editProps}>{ children }</CmsEditable>
  return <div className={ className } style={ style }>{ children }</div>
}

export default VisualBuilderNode