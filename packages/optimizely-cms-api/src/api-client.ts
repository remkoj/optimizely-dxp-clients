import * as Operations from './client/sdk.gen'
import { createClient, createConfig, type RequestResult, type ResponseStyle } from './client/client';
import * as InstanceOperations from './instance.client/sdk.gen'
import {
  createClient as createInstanceClient,
  createConfig as createInstanceConfig,
  type RequestResult as InstanceRequestResult,
  type ResponseStyle as InstanceResponseStyle
} from './instance.client/client';
import { type CmsIntegrationApiOptions, readEnvConfig } from "./config";
import { type InstanceApiVersionInfo, OptiCmsVersion } from "./types";
import { createClientConfig } from './client-config'
import buildInfo from "./version.json"

type OperationsType = { -readonly [KT in keyof typeof Operations]: (typeof Operations)[KT] }
type OperationsNames = keyof OperationsType
type OperationReturnType<RT extends (...args: any) => any> = ReturnType<RT> extends RequestResult<any, any, boolean, ResponseStyle> ? Promise<NonNullable<Awaited<ReturnType<RT>>['data']>> : never

type InstanceOperationsType = { -readonly [KT in keyof typeof InstanceOperations]: (typeof InstanceOperations)[KT] }
type InstanceOperationsNames = keyof InstanceOperationsType
type InstanceOperationReturnType<RT extends (...args: any) => any> = ReturnType<RT> extends InstanceRequestResult<any, any, boolean, InstanceResponseStyle> ? Promise<NonNullable<Awaited<ReturnType<RT>>['data']>> : never

type BaseApiClientFunctions = {
  readonly [KT in OperationsNames]: OperationsType[KT] extends Function ?
  (options?: Parameters<OperationsType[KT]>[0]) => OperationReturnType<OperationsType[KT]> :
  never
}
type InstanceClientFunctions = {
  readonly [KT in InstanceOperationsNames as InstanceOperationsType[KT] extends Function ? `preview2${Capitalize<KT>}` : never]: InstanceOperationsType[KT] extends Function ?
  (options?: Parameters<InstanceOperationsType[KT]>[0]) => InstanceOperationReturnType<InstanceOperationsType[KT]> :
  never
}
type ApiClientFunctions = BaseApiClientFunctions & InstanceClientFunctions
type FunctionList<T extends Object> = keyof { [PN in keyof T as T[PN] extends Function ? PN : never]: T[PN] }

type BaseClass = {
  new(...args: any[]): BaseApiClient
};

type NonConstructorKeys<T> = ({ [P in keyof T]: T[P] extends new () => any ? never : P })[keyof T];
type OmitConstructor<TBase extends BaseClass> = Pick<TBase, NonConstructorKeys<TBase>>
export type ClassWithMixin<TBase extends BaseClass, Mixin> = OmitConstructor<TBase> & {
  new(...args: ConstructorParameters<TBase>): InstanceType<TBase> & Mixin
}

function applyOperations<TBase extends BaseClass>(Base: TBase): ClassWithMixin<TBase, ApiClientFunctions> {
  // Create the new class
  class NewClass extends Base {
    constructor(...args: any) {
      super(...args)
    }
  }

  // Bind the operations
  Object.getOwnPropertyNames(Operations).filter(isApiClientFunction).forEach(propName => {
    type PropNameKey = typeof propName
    type MethodArgs = NonNullable<Parameters<typeof Operations[PropNameKey]>[0]> extends Operations.Options<infer TData, boolean> ? TData : never

    async function wrapper(args: Omit<MethodArgs, 'url'>) {
      const operationArgs: Omit<Operations.Options<MethodArgs>, 'headers'> = {
        throwOnError: false,
        ...args,
        //@ts-expect-error
        client: this._client
      }
      //@ts-expect-error
      const result = await Operations[propName](operationArgs)
      if (result.data)
        return result.data
      throw new ApiError(result)
    }

    //@ts-expect-error
    NewClass.prototype[propName] = wrapper
  })

  // Bind the older Preview2 operations
  Object.getOwnPropertyNames(InstanceOperations).filter(isInstanceClientFunction).forEach(propName => {
    type PropNameKey = typeof propName
    type MethodArgs = NonNullable<Parameters<typeof InstanceOperations[PropNameKey]>[0]> extends Operations.Options<infer TData, boolean> ? TData : never

    async function wrapper(args: Omit<MethodArgs, 'url'>) {
      const operationArgs: Omit<Operations.Options<MethodArgs>, 'headers'> = {
        throwOnError: false,
        ...args,
        //@ts-expect-error
        client: this._instanceClient
      }
      //@ts-expect-error
      const result = await InstanceOperations[propName](operationArgs)
      if (result.data)
        return result.data
      throw new ApiError(result)
    }

    const fnName: keyof InstanceClientFunctions = `preview2${toCapitalized(propName)}`

    //@ts-expect-error
    NewClass.prototype[fnName] = wrapper
  })

  // Return the new class
  return NewClass as unknown as ClassWithMixin<TBase, ApiClientFunctions>
}

function toCapitalized<S extends string>(toCapitalize: S): Capitalize<S> {
  return (toCapitalize.substring(0, 1).toUpperCase() + toCapitalize.substring(1)) as Capitalize<S>
}

function createIsFunctionValidator<T extends Object>(baseType: T): (propName: string) => propName is FunctionList<T> {
  return (propName: string): propName is FunctionList<T> => {
    return typeof (baseType[propName as keyof T]) == 'function'
  }
}

const isApiClientFunction = createIsFunctionValidator(Operations)
const isInstanceClientFunction = createIsFunctionValidator(InstanceOperations)

class BaseApiClient {
  protected _config: CmsIntegrationApiOptions
  protected _client: ReturnType<typeof createClient>
  protected _instanceClient: ReturnType<typeof createInstanceClient>

  public constructor(config?: CmsIntegrationApiOptions) {
    // Store instance variables
    this._config = config ?? readEnvConfig()
    this._client = createClient(createClientConfig(createConfig({
      baseUrl: 'https://api.cms.optimizely.com/preview3'
    }), this._config));
    this._instanceClient = createInstanceClient(createClientConfig(createInstanceConfig({
      baseUrl: new URL('/_cms/preview2', this._config.base).href
    })));

    // Configure Client
    if (this._config.debug) {
      this._client.interceptors.request.use(async (request) => {
        console.log(`🔍 [CMS API] Sending ${request.method} request to ${request.url}`)
        return request
      })
      this._client.interceptors.response.use((response, request) => {
        console.log(`✨ [CMS API] Received response ${response.status} ${response.statusText} of type ${response.headers.get('Content-Type') ?? 'unknown'} for ${request.url}`)
        return response
      })
      this._instanceClient.interceptors.request.use(async (request) => {
        console.log(`🔍 [CMS API] Sending ${request.method} request to ${request.url}`)
        return request
      })
      this._instanceClient.interceptors.response.use((response, request) => {
        console.log(`✨ [CMS API] Received response ${response.status} ${response.statusText} of type ${response.headers.get('Content-Type') ?? 'unknown'} for ${request.url}`)
        return response
      })
    }
  }

  /**
   * Get the runtime configuration of the target CMS version. 
   * 
   * If this differs from the cmsVersion the client may not work fully or not
   * at all.
   * 
   * @deprecated  This is based on the OPTIMIZELY_CMS_SCHEMA environment that is ignored by API client
   */
  public get runtimeCmsVersion(): OptiCmsVersion {
    return this._config.cmsVersion ?? OptiCmsVersion.CMSSAAS
  }

  /**
   * The URL of the CMS instance
   */
  public get cmsUrl(): URL | undefined {
    if (this._config.base)
      return this._config.base
    const baseUrl = this._client.getConfig().baseUrl
    return baseUrl ? new URL(baseUrl) : undefined
  }

  /**
   * Marker to indicate if the client has debugging enabled
   */
  public get debug(): boolean {
    return this._config.debug ?? false
  }

  /**
   * Detect the API Version from the URL, returning the runtime version. When
   * this version differs from the `apiVersion` property errors can be expected.
   */
  public get version(): string {
    const baseUrl = this._client.getConfig().baseUrl
    const detectedVersion = baseUrl?.match(/^https{0,1}:\/\/.+?\/(_cms\/){0,1}([a-z0-9\.]+)(\/|$)/)?.at(2)
    return detectedVersion || ""
  }

  /**
   * The API version for which this client was build
   */
  public get apiVersion(): string {
    return buildInfo.api
  }

  /**
   * The CMS version for which this client was build
   */
  public get cmsVersion(): string {
    return buildInfo.cms
  }

  /**
   * Retrieve the version information 
   * 
   * @returns The version information from the running instance
   */
  public async getInstanceInfo(): Promise<InstanceApiVersionInfo> {
    const result = await this._client.get({
      url: '/info'
    })
    const instanceResult = await this._instanceClient.get({
      url: '/info'
    })
    if (result.data) {
      const data = result.data as InstanceApiVersionInfo
      data.baseUrl = this._client.getConfig().baseUrl;
      data.results = {
        preview2Data: {
          baseUrl: this._instanceClient.getConfig().baseUrl,
          ...instanceResult?.data ?? {}
        },
        ...data.results,
      }
      return data;
    }

    throw new ApiError(result)
  }

  public async getOpenApiSpec(): Promise<any> {
    const result = await this._client.get({
      url: '/docs/content-openapi.json',
    })
    if (result.data)
      return result.data

    throw new ApiError(result)
  }
}

export class ApiError extends Error {
  protected _ctx: { error: unknown, request: Request, response: Response }

  constructor(data: { error: unknown, request: Request, response: Response }) {
    if (typeof data.error == 'string')
      super(data.error)
    else
      super(`Optimizely CMS API Error: ${data.response.status} ${data.response.statusText}`)
    this._ctx = data;
  }

  public get data(): unknown {
    return this._ctx.error
  }

  /**
   * @deprecated use data() instead
   */
  public get body(): unknown {
    return this._ctx.error
  }

  public get request(): unknown {
    return this._ctx.request
  }

  public get response(): unknown {
    return this._ctx.response
  }

  public get status(): number {
    return this._ctx.response.status
  }

  public get statusText(): string {
    return this._ctx.response.statusText
  }
}

export const ApiClient = applyOperations(BaseApiClient)
export type ApiClientStatic = typeof ApiClient
export type CmsIntegrationApiClient = InstanceType<typeof ApiClient>
export default ApiClient