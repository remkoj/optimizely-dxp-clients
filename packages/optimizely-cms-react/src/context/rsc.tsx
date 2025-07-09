import 'server-only'
import {
  createClient,
  isOptiGraphClient,
  type IOptiGraphClient,
  type ContentLink,
} from '@remkoj/optimizely-graph-client'
import React from 'react'
import {
  type GenericContext,
  type RenderMode,
  type TransferrableContext,
} from './types.js'
import {
  type ComponentFactory,
  type ComponentTypeDictionary,
  DefaultComponentFactory,
} from '../factory/index.js'
import { isDebug, isDevelopment } from '../rsc-utilities.js'

export * from './types.js'

export type ServerContextArgs = {
  factory?: ComponentFactory | ComponentTypeDictionary
  client?: IOptiGraphClient
  locale?: string
  mode?: RenderMode
  editableContent?: ContentLink
}

export class ServerContext implements GenericContext {
  private _mode: RenderMode
  private _locale: string | undefined
  private _client: IOptiGraphClient | undefined
  private _factory: ComponentFactory
  private _editable: GenericContext['editableContent']
  private _editableIsExperience: boolean = false

  get client(): IOptiGraphClient | undefined {
    return this._client
  }
  get factory(): ComponentFactory {
    return this._factory
  }

  get locale(): string | undefined {
    return this._locale
  }
  get inEditMode(): boolean {
    return this._mode == 'edit'
  }
  get inPreviewMode(): boolean {
    return this._mode == 'preview'
  }
  get isDevelopment(): boolean {
    return isDevelopment()
  }
  get isDebug(): boolean {
    return isDebug()
  }
  get isDebugOrDevelopment(): boolean {
    return this.isDebug || this.isDevelopment
  }
  get editableContent(): GenericContext['editableContent'] {
    return this._editable
  }
  get editableContentIsExperience(): boolean {
    return this._editableIsExperience
  }
  set editableContentIsExperience(newValue: boolean) {
    this._editableIsExperience = newValue
  }

  public constructor({
    factory,
    client,
    locale,
    mode,
    editableContent,
  }: ServerContextArgs) {
    this._factory = Array.isArray(factory)
      ? new DefaultComponentFactory(factory)
      : factory || new DefaultComponentFactory()
    this._client = client || createClient()
    this._locale = locale
    this._mode = mode ?? 'public'
    this._editable = editableContent
  }

  public setMode(mode: 'edit' | 'preview' | 'public'): ServerContext {
    if (this._mode != mode) {
      if (this.isDebug)
        console.log(
          `🦺 [ServerContext] Updating mode from ${this._mode} to ${mode}`
        )
      this._mode = mode
    }
    return this
  }

  public setLocale(locale: string): ServerContext {
    if (this._locale != locale) {
      if (this.isDebug)
        console.log(
          `🦺 [ServerContext] Updating locale from ${this._locale} to ${locale}`
        )
      this._locale = locale
    }
    return this
  }
  public setOptimizelyGraphClient(
    client:
      | IOptiGraphClient
      | ((
          currentClient: IOptiGraphClient | undefined
        ) => IOptiGraphClient | undefined)
  ) {
    if (this.isDebug)
      console.log(`🦺 [ServerContext] Assigning new Optimizely Graph Client`)
    this._client =
      typeof client == 'function'
        ? client(this._client)
        : isOptiGraphClient(client)
          ? client
          : undefined
  }
  public setComponentFactory(
    factory:
      | ComponentFactory
      | ((currentClient: ComponentFactory | undefined) => ComponentFactory)
  ) {
    if (this.isDebug)
      console.log(`🦺 [ServerContext] Assigning new Component Factory`)
    const newFactory =
      typeof factory == 'function' ? factory(this._factory) : factory
    if (!newFactory)
      throw new Error('Unsetting the context factory is not allowed!')
    this._factory = newFactory
  }
  public setEditableContentId(link: GenericContext['editableContent']) {
    if (this.isDebug)
      console.log(
        `🦺 [ServerContext] Assigning editable content id: ${JSON.stringify(link)}`
      )
    this._editable = link
  }
  public setEditableContentIsExperience(isExperience: boolean) {
    this._editableIsExperience = isExperience
  }

  public toJSON(key?: string): TransferrableContext {
    /*if (this.isDebugOrDevelopment) {
      console.warn(
        '🦺 [ServerContext] Converting Context to JSON, this is typically a side effect of the context being passed between Server & Client components'
      )
      if (this.isDebug) {
        console.trace('The conversion happened here')
      }
    }*/

    return {
      inEditMode: this.inEditMode,
      inPreviewMode: this.inPreviewMode,
      isDebug: this.isDebug,
      isDebugOrDevelopment: this.isDebugOrDevelopment,
      isDevelopment: this.isDevelopment,
      clientConfig: this.client?.toJSON(),
      locale: this.locale,
    }
  }
}

//#region Obsolete & Deprecated methods, as context must be handed down in React Server Context
/**
 * Obtain an instance of the servercontext, this either uses `React.cache`,
 * when available in the current context. If `React.cache` is not available, the
 * fall-back is to create a new instance every time this method is called.
 *
 * It the cache fallback will notify in development or debug mode when it is in
 * use.
 *
 * @deprecated  Use the context handed down through the CmsContentArea and CmsContent
 *              components
 */
export const getServerContext = () => {
  if (isDebug())
    console.debug(
      '🦺 [ServerContext] getServerContext has been deprecated, this provides an instance of the Server Context that is potentially shared between requests'
    )
  return internalGetServerContext()
}

/**
 * Update the shared server context from the provided context. This is compatibility
 * method to ensure that the value returned by `getServerContext` can be retrieved and
 * updated.
 *
 * @deprecated  Use the context handed down through the CmsContentArea and CmsContent
 *              components
 * @param       currentCtx    The current context to apply to the server context
 * @returns     The updated shared server context
 */
export function updateSharedServerContext(
  currentCtx: GenericContext
): ServerContext {
  const serverCtx = internalGetServerContext()
  // Update component factory
  serverCtx.setComponentFactory(currentCtx.factory)

  // Update Optimizely Graph Client
  if (currentCtx.client) serverCtx.setOptimizelyGraphClient(currentCtx.client)

  // Update locale
  if (currentCtx.locale) serverCtx.setLocale(currentCtx.locale)

  // Update mode
  if (currentCtx.inEditMode) serverCtx.setMode('edit')
  else if (currentCtx.inPreviewMode) serverCtx.setMode('preview')
  else if (!currentCtx.inEditMode && !currentCtx.inPreviewMode)
    serverCtx.setMode('public')

  // Update editable content
  serverCtx.setEditableContentId(currentCtx.editableContent)
  return serverCtx
}
//#endregion

//#region Internal methods & types
type CachePlaceHolder = <M extends (...args: any[]) => any>(
  factory: M
) => (...args: Parameters<M>) => ReturnType<M>
const cachePlaceholder: CachePlaceHolder = <M extends (...args: any) => any>(
  factory: M
) => {
  if (isDebug() || isDevelopment())
    console.warn(
      '🚧 [React Context] Running client/server react code instead of server context, no cache() available.'
    )
  return factory
}

//@ts-ignore React.cache is only available in the react-server context
const cache = (React.cache || cachePlaceholder) as CachePlaceHolder

const internalGetServerContext = cache(() => {
  const ctx = new ServerContext({})
  if (ctx.isDebug) console.log('🦺 [ServerContext] Created new context')
  return ctx
})
//#endregion
