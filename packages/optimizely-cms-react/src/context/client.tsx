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
  type OptimizelyGraphConfig,
  type IOptiGraphClient,
} from '@remkoj/optimizely-graph-client'
import { type GenericContext, type TransferrableContext } from './types.js'
import {
  getFactory,
  type ComponentTypeDictionary,
  type ComponentFactory,
  DefaultComponentFactory,
} from '../factory/index.js'
import { UndefinedComponentFactory } from '../factory/undef.js'
import { isTransferrableContext } from './shared.js'

export const enum OptimizelyCmsMode {
  default = 'default',
  edit = 'edit',
  preview = 'preview',
}

export interface ClientContext extends GenericContext {
  setLocale: Dispatch<SetStateAction<string | undefined>>
  setMode: Dispatch<SetStateAction<OptimizelyCmsMode>>
  setEditableContentIsExperience: Dispatch<SetStateAction<boolean>>
}

export class ClientContextInstance implements GenericContext {
  readonly client?: IOptiGraphClient | undefined
  readonly factory: ComponentFactory
  readonly locale?: string | undefined
  readonly inEditMode: boolean
  readonly inPreviewMode: boolean
  readonly isDevelopment: boolean
  readonly isDebug: boolean
  readonly isDebugOrDevelopment: boolean

  public constructor(
    cfg: TransferrableContext,
    components: ComponentTypeDictionary
  ) {
    this.client = isOptiGraphClient(cfg.client)
      ? cfg.client
      : isOptiGraphConfig(cfg.client)
        ? createClient(cfg.client)
        : createClient()
    this.factory = new DefaultComponentFactory(components)
    this.inEditMode = cfg.inEditMode
    this.inPreviewMode = cfg.inPreviewMode
    this.isDebug = cfg.isDebug
    this.isDebugOrDevelopment = cfg.isDebugOrDevelopment
    this.isDevelopment = cfg.isDevelopment
  }
}

const _clientContext = createContext<ClientContext>({
  factory: new UndefinedComponentFactory(),
  inEditMode: false,
  inPreviewMode: false,
  isDebug: false,
  isDebugOrDevelopment: false,
  isDevelopment: false,
  editableContentIsExperience: false,
  setLocale: () => {
    throw new Error('Not implemented')
  },
  setMode: () => {
    throw new Error('Not implemented')
  },
  setEditableContentIsExperience: () => {
    throw new Error('Not implemented')
  },
})
_clientContext.displayName = 'Optimizely CMS Provider'

export type OptimizelyCmsProps = {
  /**
   * The Optimizely Graph Client to use, provide either an instance of the
   * client, or the configuration used to create the instance. In case you
   * provide no parameters, the Client will try to infer the configuration
   * from the environment variables.
   */
  client?: null | OptimizelyGraphConfig | IOptiGraphClient

  /**
   * The authentication token to use for the Optimizely Graph Client. This
   * token will be applied to the client after it has been resolved from the
   * `client` property. If not provided the current authentication data of
   * the client will not be affected.
   */
  clientToken?: string

  /**
   * Marker to indicate if the debug mode should be activated. If not provided
   * it will be read from the Optimizely Graph Client, inferred by the `client`
   * property.
   */
  isDebug?: boolean

  /**
   * Marker to indicate if the development mode should be activated. If not
   * provided, it will be read from the `process.env.NODE_ENV` variable. If
   * this variable is not set it assumes it to be "production".
   */
  isDevelopment?: boolean

  /**
   * The default mode to initialize the context with, after initialization the
   * current mode will be state managed using `useState`.
   */
  initialMode?: OptimizelyCmsMode
} & (
  | {
      /**
       * The component factory to be used to resolve content within the scope
       * of this provider.
       */
      factory: ComponentFactory

      /**
       * The defaults components to apply when there's no factory provided. If a
       * factory is provided, these components will not be added to the factory.
       */
      initialComponents?: never
    }
  | {
      /**
       * The component factory to be used to resolve content within the scope
       * of this provider.
       */
      factory?: never

      /**
       * The defaults components to apply when there's no factory provided. If a
       * factory is provided, these components will not be added to the factory.
       */
      initialComponents: ComponentTypeDictionary
    }
)

export const OptimizelyCms: FunctionComponent<
  PropsWithChildren<OptimizelyCmsProps>
> = ({
  factory,
  client,
  clientToken,
  children,
  isDebug,
  isDevelopment,
  initialMode = OptimizelyCmsMode.default,
  initialComponents = [],
}) => {
  const CtxProvider = _clientContext.Provider

  //#region React State
  const [locale, setLocale] = useState<string>()
  const [mode, setMode] = useState<OptimizelyCmsMode>(initialMode)
  const [editableContentIsExperience, setEditableContentIsExperience] =
    useState<boolean>(false)
  //#endregion

  //#region Memoized Optimizely Graph Client
  const graphClient = useMemo(() => {
    const gc = isOptiGraphClient(client)
      ? client
      : createClient(isOptiGraphConfig(client) ? client : undefined)
    if (clientToken) gc.updateAuthentication(clientToken)
    return gc
  }, [client, clientToken])
  //#endregion

  //#region Memoized Debug and Development flags
  const isDev = useMemo(
    () =>
      isDevelopment == undefined
        ? getNodeEnv() == 'development'
        : isDevelopment,
    [isDevelopment]
  )
  const isDbg = useMemo(
    () => (isDebug == undefined ? graphClient.debug : isDebug),
    [isDebug, graphClient]
  )
  //#endregion

  //#region Memoized Component Factory
  const ctxFactory = useMemo(() => {
    if (factory) return factory
    const newFactory = getFactory()
    newFactory.registerAll(initialComponents)
    return newFactory
  }, [factory])
  //#endregion

  const ctxValue: ClientContext = {
    client: graphClient,
    factory: ctxFactory,
    isDebug: isDbg,
    isDevelopment: isDev,
    isDebugOrDevelopment: isDbg || isDev,
    inEditMode: mode == OptimizelyCmsMode.edit,
    inPreviewMode: mode == OptimizelyCmsMode.preview,
    locale,
    get editableContentIsExperience() {
      return editableContentIsExperience
    },
    set editableContentIsExperience(newValue: boolean) {
      setEditableContentIsExperience(newValue)
    },
    setLocale,
    setMode,
    setEditableContentIsExperience,
  }

  return <CtxProvider value={ctxValue}>{children}</CtxProvider>
}

export const useOptimizelyCms = () => {
  return useContext(_clientContext)
}

export function fromTransferrableContext(
  serialized: TransferrableContext,
  components: ComponentTypeDictionary
): GenericContext {
  if (!isTransferrableContext(serialized))
    throw new Error('Unable to restore from serialized data')
  return new ClientContextInstance(serialized, components)
}

function getNodeEnv(): string {
  let env: string | undefined
  try {
    env = process.env.NODE_ENV
  } catch {
    // Ignored on purpose
  }
  return env || 'production'
}
