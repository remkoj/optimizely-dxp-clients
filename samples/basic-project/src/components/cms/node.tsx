import {
  CmsEditable,
  type CmsLayoutComponent,
} from '@remkoj/optimizely-cms-react/rsc'

export const VisualBuilderNode: CmsLayoutComponent = ({
  contentLink,
  layoutProps,
  children,
  ctx,
}) => {
  let className = `vb:${layoutProps?.layoutType}`
  if (layoutProps && layoutProps.layoutType == 'section')
    return (
      <CmsEditable
        as="div"
        className={className}
        cmsId={contentLink.key}
        ctx={ctx}
      >
        {children}
      </CmsEditable>
    )
  return <div className={className}>{children}</div>
}

export default VisualBuilderNode
