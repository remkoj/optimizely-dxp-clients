import { type IOptiGraphClient } from "@remkoj/optimizely-graph-client"
import { type ComponentFactory } from "../factory/types.js"

export interface GenericContext {
    readonly client?: IOptiGraphClient
    readonly factory: ComponentFactory
    readonly locale?: string
    readonly inEditMode: boolean
    readonly inPreviewMode: boolean
    readonly isDevelopment: boolean
    readonly isDebug: boolean
    readonly isDebugOrDevelopment: boolean
}

export type PropsWithContext<P = any> = P & {
    ctx: GenericContext
}