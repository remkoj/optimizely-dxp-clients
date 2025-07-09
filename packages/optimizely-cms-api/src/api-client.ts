import * as Operations from './client/sdk.gen'
import { type CmsIntegrationApiOptions, getCmsIntegrationApiConfigFromEnvironment } from "./config";
import { type InstanceApiVersionInfo, OptiCmsVersion } from "./types";
import { createClient, type RequestResult, type ResponseStyle } from './client/client';
import type { CreateClientConfig } from './client/client.gen';
import buildInfo from "./version.json"
import { getAccessToken as getAccessTokenImpl } from './getaccesstoken'

type OperationsType = { -readonly [KT in keyof typeof Operations]: (typeof Operations)[KT] }
type OperationsNames = keyof OperationsType
type OperationReturnType<RT extends (...args: any) => any> = ReturnType<RT> extends RequestResult<any, any, boolean, ResponseStyle> ? Promise<NonNullable<Awaited<ReturnType<RT>>['data']>> : never
type ApiClientFunctions = {
  readonly [KT in OperationsNames]: OperationsType[KT] extends Function ?
  (options?: Parameters<OperationsType[KT]>[0]) => OperationReturnType<OperationsType[KT]> :
  never
}

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
  Object.getOwnPropertyNames(Operations).filter(isApiClientFunction).forEach((propName) => {
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

  // Return the new class
  return NewClass as unknown as ClassWithMixin<TBase, ApiClientFunctions>
}

function isApiClientFunction(propName: string): propName is keyof ApiClientFunctions {
  return typeof (Operations[propName as keyof OperationsType]) == 'function'
}

class BaseApiClient {
  protected _config: CmsIntegrationApiOptions
  protected _client: ReturnType<typeof createClient>
  private _token: Promise<string> | undefined

  protected getAccessToken(): Promise<string> {
    if (!this._token)
      this._token = getAccessTokenImpl(this._config)
    return this._token
  }

  public constructor(config?: CmsIntegrationApiOptions) {
    // Prepare config
    const options = config ?? getCmsIntegrationApiConfigFromEnvironment()
    options.base = new URL("/_cms/preview2", options.base)
    if (options.cmsVersion == OptiCmsVersion.CMS12)
      options.base.pathname = options.base.pathname.replace('preview2', 'preview1')

    // Store instance variables
    this._config = options
    this._client = createClient(this.createClientConfig())

    // Configure Client
    this._client.interceptors.request.use(async (request) => {
      const token = await this.getAccessToken()
      request.headers.set('Authorization', 'Bearer ' + token);
      if (this._config.debug) {
        console.log(`🔍 Sending ${request.method} request to ${request.url}`)
      }
      return request
    })
    if (this._config.debug)
      this._client.interceptors.response.use((response, request) => {
        console.log(`✨ Received response ${response.status} ${response.statusText} of type ${response.headers.get('Content-Type') ?? 'unknown'} for ${request.url}`)
        return response
      })
  }

  /**
   * Get the runtime configuration of the target CMS version. 
   * 
   * If this differs from the cmsVersion the client may not work fully or not
   * at all.
   */
  public get runtimeCmsVersion(): OptiCmsVersion {
    return this._config.cmsVersion ?? OptiCmsVersion.CMS13
  }

  /**
   * The URL of the CMS instance
   */
  public get cmsUrl(): URL {
    return this._config.base
  }

  /**
   * Marker to indicate if the client has debugging enabled
   */
  public get debug(): boolean {
    return this._config.debug ?? false
  }

  public get version(): string {
    return this._config.cmsVersion == OptiCmsVersion.CMS12 ? 'preview1' : 'preview2'
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
    if (result.data)
      return result.data as InstanceApiVersionInfo

    throw new ApiError(result)
  }

  protected createClientConfig: CreateClientConfig = (override) => {
    return {
      ...override,
      baseUrl: this._config.base.href
    }
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