import type { ComponentProps, FunctionComponent } from 'react'
import type { RichTextElementProps, RichTextImplProps } from './types.js'
import * as Utils from './utils.js'
import { DefaultComponentFactory } from '../../factory/default.js'
import {
  DefaultComponents,
  DefaultTextNode,
  createHtmlComponent,
} from './components.js'
import { type PropsWithContext } from '../../context/types.js'
import { CmsEditable } from '../cms-editable/index.js'
import type { ElementWithChildrenType } from '../type-utils.js'

export * from './types.js'

export const RichText = <ET extends ElementWithChildrenType>({
  factory,
  text = '{ "type": "richText" }',
  className = 'rich-text',
  as: Wrapper = 'div' as ET,
  debug = false,
  noWrapper = false,
  cmsFieldName = null,
  cmsId = null,
  ctx,
  children,
  ...props
}: RichTextImplProps<ET>) => {
  const id = Utils.getRandomId('rich-text')
  const richTextFactory =
    ctx.factory ?? factory ?? new DefaultComponentFactory(DefaultComponents)
  const isDebug = ctx.isDebug || debug

  try {
    const data = Utils.processNodeInput(text)
    const textContent =
      data?.children?.map((child, idx) => {
        const elementId = id + '::' + idx
        return (
          <RichTextElement
            key={elementId}
            factory={richTextFactory}
            node={child}
            idPrefix={elementId + '::'}
            ctx={ctx}
          />
        )
      }) || children

    if (cmsId || cmsFieldName)
      return (
        <CmsEditable
          as={(Wrapper ?? 'div') as ComponentProps<typeof CmsEditable>['as']}
          className={className}
          cmsId={cmsId || undefined}
          cmsFieldName={cmsFieldName || undefined}
          ctx={ctx}
          {...props}
        >
          {textContent}
        </CmsEditable>
      )

    if (noWrapper || !Wrapper) return <>{textContent}</>

    return (
      //@ts-expect-error
      <Wrapper className={className} {...props}>
        {textContent}
      </Wrapper>
    )
  } catch {
    if (isDebug)
      console.warn('🟠 [Rich Text] Invalid rich text received: ', text)
    return Object.getOwnPropertyNames(props).length > 0 ? (
      <div className={className} {...props}>
        {children}
      </div>
    ) : (
      <>{children}</>
    )
  }
}

//#region Supportive React components
const RichTextElement: FunctionComponent<
  PropsWithContext<RichTextElementProps>
> = ({ factory, node, idPrefix, debug, ctx }) => {
  const isDebug = ctx.isDebug || debug

  // Render text
  if (Utils.isText(node)) {
    if (node.text.length == 0) return null
    const TextComponent = factory?.resolve(`RichText/text`) ?? DefaultTextNode
    return <TextComponent node={node} ctx={ctx} />
  }

  // Ignore incorrect data
  if (!Utils.isTypedNode(node)) {
    if (isDebug)
      console.warn(
        '🟠 [Rich Text] Invalid rich text element data received:',
        node
      )
    return null
  }

  // Process children
  const childData =
    node.children && node.children.length > 0
      ? node.children.map((child, idx) => {
          const elementId = idPrefix + idx
          return (
            <RichTextElement
              key={elementId}
              factory={factory}
              node={child}
              idPrefix={elementId + '::'}
              ctx={ctx}
            />
          )
        })
      : undefined

  // Resolve component (and add to factory if not yet present)
  let Component = factory?.resolve(`RichText/${node.type}`)
  if (!Component) {
    if (isDebug)
      console.warn(
        `🟠 [Rich Text] No renderer for node type, using and registering HtmlComponent for "${node.type}": RichText/${node.type}`
      )
    Component = createHtmlComponent(node.type as keyof JSX.IntrinsicElements)
    factory?.register(`RichText/${node.type}`, Component)
  }

  // Return component
  return (
    <Component node={node} ctx={ctx}>
      {childData && childData.length > 0 ? childData : undefined}
    </Component>
  )
}
//#endregion
