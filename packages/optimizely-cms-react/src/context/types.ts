import { type IOptiGraphClient, type OptimizelyGraphConfig, type ContentLink } from "@remkoj/optimizely-graph-client"
import { type ComponentFactory } from "../factory/types.js"

/**
 * The mode in which content is currently being rendered
 */
export type RenderMode = 'edit' | 'preview' | 'public'

/**
 * The information shared across CMS components to render content, resolve
 * templates and detect the current rendering mode.
 */
export interface GenericContext {
  /**
   * The Optimizely Graph client to use for loading content
   */
  readonly client?: IOptiGraphClient

  /**
   * The component factory used to resolve CMS templates
   */
  readonly factory: ComponentFactory

  /**
   * The locale to render content in
   */
  readonly locale?: string

  /**
   * Whether the content is being rendered within the CMS On-Page/Visual Builder editor
   */
  readonly inEditMode: boolean

  /**
   * Whether the content is being rendered in preview mode
   */
  readonly inPreviewMode: boolean

  /**
   * Whether the application is running in development mode
   */
  readonly isDevelopment: boolean

  /**
   * Whether debug logging has been enabled
   */
  readonly isDebug: boolean

  /**
   * Convenience flag, `true` when either `isDebug` or `isDevelopment` is `true`
   */
  readonly isDebugOrDevelopment: boolean

  /**
   * The content item that is currently being edited, if any
   */
  readonly editableContent?: ContentLink | null

  /**
   * Whether the content item being edited is an experience
   */
  editableContentIsExperience?: boolean
}

/**
 * The context information that can cross the React Server/Client boundary
 */
export type TransferrableContext = {
  readonly client?: OptimizelyGraphConfig
} & Readonly<Omit<GenericContext, 'client' | 'factory'>>

/**
 * Either the transferrable (serializable) context or the full context object
 */
export type BaseContext = TransferrableContext | GenericContext

/**
 * Adds a required CMS context property to a set of props
 */
export type PropsWithContext<P = object> = P & {
  ctx: GenericContext
}

/**
 * Adds an optional CMS context property to a set of props
 */
export type PropsWithOptionalContext<P = object> = P & {
  /**
   * The context to be used when rendering this component
   */
  ctx?: GenericContext
}