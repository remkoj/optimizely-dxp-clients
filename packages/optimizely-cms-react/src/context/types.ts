import { type IOptiGraphClient, type OptimizelyGraphConfig, type ContentLink } from "@remkoj/optimizely-graph-client"
import { type ComponentFactory } from "../factory/types.js"

export type RenderMode = 'edit' | 'preview' | 'public'

export interface GenericContext {
  readonly client?: IOptiGraphClient
  readonly factory: ComponentFactory
  readonly locale?: string
  readonly inEditMode: boolean
  readonly inPreviewMode: boolean
  readonly isDevelopment: boolean
  readonly isDebug: boolean
  readonly isDebugOrDevelopment: boolean
  readonly editableContent?: ContentLink | null
  editableContentIsExperience?: boolean
}

/**
 * The context information that can cross the React Server/Client boundary
 */
export type TransferrableContext = {
  readonly client?: OptimizelyGraphConfig
} & Readonly<Omit<GenericContext, 'client' | 'factory'>>

export type BaseContext = TransferrableContext | GenericContext

export type PropsWithContext<P = {}> = P & {
  ctx: GenericContext
}

export type PropsWithOptionalContext<P = {}> = P & {
  /**
   * The context to be used when rendering this component
   */
  ctx?: GenericContext
}