import 'server-only'
import { createClient, isOptiGraphClient, type IOptiGraphClient, type ContentLink } from '@remkoj/optimizely-graph-client'
import React from 'react'
import { type GenericContext } from './types.js'
import { type ComponentFactory, DefaultComponentFactory } from '../factory/index.js'
import { isDebug, isDevelopment } from '../rsc-utilities.js'

export * from "./types.js"

type CachePlaceHolder = <M extends (...args: any[]) => any>(factory: M) => ((...args: Parameters<M>) => ReturnType<M>)
const cachePlaceholder : CachePlaceHolder = <M extends (...args: any) => any>(factory: M) => 
{
    if (isDebug() || isDevelopment())
        console.warn("🚧 [React Context] Running client/server react code instead of server context, no cache() available.")
    return factory
}

//@ts-expect-error React.cache is only available in the react-server context
const cache = (React.cache || cachePlaceholder) as CachePlaceHolder

type ServerContextArgs = {factory ?: ComponentFactory, client?: IOptiGraphClient, locale?: string}

class ServerContext implements GenericContext
{
    private _mode : 'edit' | 'preview' | 'public' = 'public'
    private _locale : string | undefined
    private _client : IOptiGraphClient | undefined
    private _factory : ComponentFactory
    private _editable : ContentLink | undefined

    get client(): IOptiGraphClient | undefined
    {
        return this._client
    }
    get factory(): ComponentFactory
    {
        return this._factory
    }

    get locale(): string | undefined
    {
        return this._locale
    }
    get inEditMode(): boolean 
    {
        return this._mode == 'edit'
    }
    get inPreviewMode(): boolean
    {
        return this._mode == 'preview'
    }
    get isDevelopment(): boolean
    {
        return isDevelopment()
    }
    get isDebug(): boolean
    {
        return isDebug()
    }
    get isDebugOrDevelopment(): boolean
    {
        return this.isDebug || this.isDevelopment
    }
    get editableContent() : ContentLink | undefined
    {
        return this._editable
    }

    public constructor({factory, client, locale} : ServerContextArgs) 
    {
        this._factory = factory || new DefaultComponentFactory()
        this._client = client || createClient()
        this._locale = locale
    }

    public setMode(mode: 'edit' | 'preview' | 'public') : ServerContext
    {
        if (this.isDebug)
            console.log(`🦺 [ServerContext] Updating mode from ${ this._mode } to ${ mode }`)
        this._mode = mode
        return this
    }

    public setLocale(locale: string) : ServerContext
    {
        if (this.isDebug)
            console.log(`🦺 [ServerContext] Updating locale from ${ this._locale } to ${ locale }`)
        this._locale = locale
        return this
    }
    public setOptimizelyGraphClient(client: IOptiGraphClient | ((currentClient: IOptiGraphClient | undefined) => IOptiGraphClient | undefined))
    {
        if (this.isDebug)
            console.log(`🦺 [ServerContext] Assigning new Optimizely Graph Client`)
        this._client = typeof(client) == 'function' ? client(this._client) : isOptiGraphClient(client) ? client : undefined
    }
    public setComponentFactory(factory: ComponentFactory | ((currentClient: ComponentFactory | undefined) => ComponentFactory))
    {
        if (this.isDebug)
            console.log(`🦺 [ServerContext] Assigning new Component Factory`)
        const newFactory = typeof(factory) == 'function' ? factory(this._factory) : factory
        if (!newFactory)
            throw new Error("Unsetting the context factory is not allowed!")
        this._factory = newFactory
    }
    public setEditableContentId(link: ContentLink)
    {
        if (this.isDebug)
            console.log(`🦺 [ServerContext] Assigning editable content id: ${ JSON.stringify(link) }`)
        this._editable = link
    }
}

/**
 * Obtain an instance of the servercontext, this either uses `React.cache`,
 * when available in the current context. If `React.cache` is not available, the
 * fall-back is to create a new instance every time this method is called.
 * 
 * It the cache fallback will notify in development or debug mode when it is in
 * use.
 */
export const getServerContext = cache(() => {
    const ctx = new ServerContext({})
    if (ctx.isDebug)
        console.log('🦺 [ServerContext] Created new context')
    return ctx
})