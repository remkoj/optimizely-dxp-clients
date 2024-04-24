import { type ComponentType, type PropsWithChildren } from "react"
import { type ContentType } from "../../../types"
import { type InlineContentLinkWithLocale, type ContentLinkWithLocale } from "@remkoj/optimizely-graph-client"

export enum StructureNodeTypes {
    Outline = "outline",
    Grid = "grid",
    Row = "row",
    Column = "column"
}
export type CompositionStructureNode = {
    name: string | null
    type: "outline" | "grid" | "row" | "column"
    nodes?: Array<CompositionNode>
}
export type CompositionElementNode<E extends Record<string,any> = Record<string,any>> = {
    name: string | null
    type: "element"
    element: E
}
export type CompositionNode<E extends Record<string,any> = Record<string,any>> = CompositionStructureNode | CompositionElementNode<E>



export type CompositionComponentType<NT extends CompositionNode> = ComponentType<NT extends CompositionElementNode<infer DT> ? { node: Omit<NT, 'element'>, element: DT } : PropsWithChildren<{ node: Omit<NT, 'nodes'>}>>
export type CompositionComponentFactory = (node: CompositionStructureNode) => CompositionComponentType<CompositionStructureNode>
export type CmsComponentPropsFactory = <ET extends Record<string,any>, LT = string>(node: CompositionElementNode<ET>) => [ ContentLinkWithLocale<LT> | InlineContentLinkWithLocale<LT>, ContentType, ET ]

export type OptimizelyCompositionProps = {
    node: CompositionNode<Record<string,any>>
    elementFactory: CompositionComponentFactory
    propsFactory?: CmsComponentPropsFactory
    key?:string
}
