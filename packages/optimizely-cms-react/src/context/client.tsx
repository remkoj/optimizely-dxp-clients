'use client'
import {
  createContext,
  useContext,
  useState,
  useMemo,
  type FunctionComponent,
  type PropsWithChildren,
  type Dispatch,
  type SetStateAction,
} from 'react'
import {
  isOptiGraphClient,
  isOptiGraphConfig,
  createClient,
  type IOptiGraphClient,
  type ContentLink,
} from '@remkoj/optimizely-graph-client'
import type { GenericContext, TransferrableContext } from './types.js'
import type { RenderMode } from '../context/types.js'
import { type ComponentTypeDictionary, type ComponentFactory, DefaultComponentFactory } from '../factory/index.js'
import { isGenericContext, isTransferrableContext } from './shared.js'

export interface IClientContext extends GenericContext {
  setLocale: Dispatch<SetStateAction<string | undefined>>
  setMode: Dispatch<SetStateAction<RenderMode>>
  setEditableContentIsExperience: Dispatch<SetStateAction<boolean>>
  setEditableContent: Dispatch<SetStateAction<ContentLink | null>>
}

export class ClientContext implements IClientContext {
  private _client?: IOptiGraphClient;
  private _factory: ComponentFactory;
  private _locale?: string | undefined;
  private _inEditMode: boolean = false;
  private _inPreviewMode: boolean = false;
  private _isDevelopment: boolean = false;
  private _isDebug: boolean = false;
  private _isDebugOrDevelopment: boolean = false;
  private _editableContent: ContentLink | null = null;
  private _editableContentIsExperience: boolean = false;

  public get client() { return this._client; }
  public get factory() { return this._factory; }
  public get locale() { return this._locale; }
  public get inEditMode() { return this._inEditMode; }
  public get inPreviewMode() { return this._inPreviewMode; }
  public get isDevelopment() { return this._isDevelopment; }
  public get isDebug() { return this._isDebug; }
  public get isDebugOrDevelopment() { return this._isDebugOrDevelopment; }
  public get editableContent() { return this._editableContent; }
  public get editableContentIsExperience() { return this._editableContentIsExperience; }  

  public constructor(
    cfg?: TransferrableContext | GenericContext | null,
    components: ComponentTypeDictionary = []
  ) {
    this._client = isOptiGraphClient(cfg?.client)
      ? cfg?.client
      : isOptiGraphConfig(cfg?.client)
        ? createClient(cfg?.client)
        : createClient()
    this._factory = new DefaultComponentFactory(components)
    this._inEditMode = cfg?.inEditMode ?? false
    this._inPreviewMode = cfg?.inPreviewMode ?? false
    this._isDebug = cfg?.isDebug ?? false
    this._isDevelopment = cfg?.isDevelopment ?? false
    this._isDebugOrDevelopment = cfg?.isDebugOrDevelopment ?? (this._isDebug || this._isDevelopment)
  }
  setLocale: Dispatch<SetStateAction<string | undefined>> = (locale) => { 
    const newLocale = typeof locale === 'function' ? locale(this._locale) : locale;
    this._locale = newLocale;
  }
  setMode: Dispatch<SetStateAction<RenderMode>> = (mode) => { 
    const newMode = typeof mode === 'function' ?
      mode(this._inEditMode ? 'edit' : this._inPreviewMode ? 'preview' : 'public') :
      mode;
    this._inEditMode = newMode === 'edit';
    this._inPreviewMode = newMode === 'preview'; 
  }
  setEditableContent: Dispatch<SetStateAction<ContentLink | null>> = (editableContent) => { 
    const newEditableContent = typeof editableContent === 'function' ?
      editableContent(this._editableContent) :
      editableContent;
    this._editableContent = newEditableContent;
  }
  setEditableContentIsExperience: Dispatch<SetStateAction<boolean>> = (editableContentIsExperience) => { 
    const newEditableContentIsExperience = typeof editableContentIsExperience === 'function' ?
      editableContentIsExperience(this._editableContentIsExperience) :
      editableContentIsExperience;
    this._editableContentIsExperience = newEditableContentIsExperience;
  }
}

export function ensureContext(
  context: TransferrableContext|GenericContext,
  components: ComponentTypeDictionary = []
): GenericContext {
  if (isTransferrableContext(context))
    return new ClientContext(context, components)
  if (isGenericContext(context))
    return context;
  throw new Error('Unable to restore from serialized data')
}

interface ClientReactContext {
  /**
   * The component dictionary that is currently available for frontend loading and
   * rendering. It is not intended to be used directly, but rather through the 
   * `GenericContext` interface that is handed to components through the `ctx` property.
   * 
   * @access private
   */
  readonly components: ComponentTypeDictionary

  /**
   * A setter function to update the component dictionary. It is not intended to be used 
   * directly, but serve as fall-back when you need to load components after the initial
   * population of the context (not recommended).
   */
  readonly setComponents: Dispatch<SetStateAction<ComponentTypeDictionary>>

  /**
   * Custom data that needs to be transferred between client side components, this
   * is not used by the library. It is provided to allow for an implementation to
   * store and share data between components, without the need to create a custom
   * context.
   */
  readonly data?: Map<string, unknown>
  readonly setData?: Dispatch<SetStateAction<Map<string, unknown>>>
}

const _clientContext = createContext<ClientReactContext>({
  components: [],
  setComponents: () => { throw new Error('No Optimizely CMS context provided. Please wrap your application in an <OptimizelyCms> component.') },
  data: new Map(),
  setData: () => { throw new Error('No Optimizely CMS context provided. Please wrap your application in an <OptimizelyCms> component.') },
})
_clientContext.displayName = 'Optimizely CMS Provider'

export type OptimizelyCmsProps = {
  initialComponents?: ComponentTypeDictionary
}

export const OptimizelyCms: FunctionComponent<
  PropsWithChildren<OptimizelyCmsProps>
> = ({ children, initialComponents }) => {
  const [components, setComponents] = useState<ComponentTypeDictionary>(
    initialComponents || []
  )
  const [data, setData] = useState<Map<string, unknown>>(new Map())

  const ctxValue = useMemo(() => ({ components, setComponents, data, setData }), [components, setComponents, data, setData])
  return <_clientContext.Provider value={ctxValue}>{children}</_clientContext.Provider>
}

export const useOptimizelyCms = () => {
  return useContext(_clientContext)
}
