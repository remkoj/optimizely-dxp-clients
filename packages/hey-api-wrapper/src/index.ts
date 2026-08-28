/* eslint-disable @typescript-eslint/no-explicit-any */
export type { OperationsList } from './types'
import type { ApiClientConfig, ApiClientFunctions, ClassWithMixin, OperationsList } from './types'

/**
 * Mixin factory that extends an {@link ApiClient} subclass with one method per
 * hey-api operation. Each generated method calls the matching operation,
 * injecting the instance's network client and `throwOnError: false`, throws an
 * {@link ApiError} when the operation reports an error, and otherwise returns
 * the response `data` (falling back to the full result).
 *
 * @param Base The {@link ApiClient} subclass to extend.
 * @param Operations Map of hey-api operation functions to bind as methods.
 * @returns A new class combining `Base` with the bound operation methods.
 *
 * @example
 * ```typescript
 * import * as SdkOps from './client/sdk.gen';
 * import { createClient } from '@hey-api/client-fetch';
 *
 * class MyCmsApiClient extends withOperations(ApiClient, SdkOps) {
 *   constructor(config: ApiClientConfig, client: ReturnType<typeof createClient>) {
 *     super(config, client);
 *   }
 * }
 *
 * const api = new MyCmsApiClient({ debug: true }, createClient({ baseUrl: 'https://cms.example.com' }));
 * const result = await api.listContent({ query: { pageSize: 10 } });
 * ```
 */
export function withOperations<TBase extends ApiClientStatic, TOperations extends OperationsList>(Base: TBase, Operations: TOperations): ClassWithMixin<TBase, ApiClientFunctions<TOperations>> {
  
  //@ts-expect-error A mixin requires an ...any[] argument, but our concrete class has
  // specified 
  class NewClass extends Base<ApiClientConfig, ApiClientNetworkClient> {
    public constructor(...args: any[]) {
      super(...args);
    }
  }

  // Create guard for this list of Operations
  const isApiClientFunction = createIsFunctionValidator(Operations);

  // Bind the operations
  ;(Object.getOwnPropertyNames(Operations) as Array<keyof TOperations>).filter(isApiClientFunction).forEach(propName => {

    async function wrapper(this: ApiClient, ...args: any[]): Promise<any> {
      
      const operationArgs = [...args];
      operationArgs[0] = {
        throwOnError: false,
        client: this._client,
        ...args[0]
      }
      
      //@ts-expect-error TypeScript can't check this as TOperations is dynamic
      const result = await Operations[propName](...operationArgs)
      if (result.error)
        throw new ApiError(result)
      return result.data ? result.data : result;
    }

    //@ts-expect-error TypeScript doesn't understand that we're creating an expected function
    NewClass.prototype[propName] = wrapper;
  });

  // Return the new class
  return NewClass as unknown as ClassWithMixin<TBase, ApiClientFunctions<TOperations>>
}

/**
 * Builds a type guard that reports whether a property name refers to a function
 * on the given operations map, narrowing it to `keyof T`.
 *
 * @param baseType The operations map to test property names against.
 * @returns A predicate that is `true` for keys whose value is a function.
 */
function createIsFunctionValidator<T extends OperationsList>(baseType: T): (propName: string|number|symbol) => propName is keyof T {
  return (propName: string|number|symbol): propName is keyof T => {
    return typeof (baseType[propName as keyof T]) == 'function'
  }
}

/**
 * Minimal network client contract required by {@link ApiClient}: a client
 * exposing request and response interceptor registration (as provided by
 * `@hey-api/client-fetch`).
 */
export type ApiClientNetworkClient = {
  interceptors: {
    request: {
      use: (interceptor: (request: Request) => Request | Promise<Request>) => number;
    }
    response: {
      use: (interceptor: (response: Response, request: Request) => Response | Promise<Response>) => number;
    }
  }
}

/**
 * The static (constructor) side of an {@link ApiClient} subclass. Used as the
 * `Base` constraint for {@link withOperations} so a concrete client class can be
 * passed despite its narrowed constructor signature.
 *
 * @typeParam C Configuration type, extending {@link ApiClientConfig}.
 * @typeParam NC Network client type, extending {@link ApiClientNetworkClient}.
 */
export type ApiClientStatic<C extends ApiClientConfig = ApiClientConfig, NC extends ApiClientNetworkClient = ApiClientNetworkClient> = {
  new (...args: any[]): ApiClient<C, NC>
}

/**
 * Abstract base for hey-api backed clients. Holds the immutable configuration
 * and network client, and—when `debug` is enabled—installs request/response
 * logging interceptors. Operation methods are added by {@link withOperations}.
 *
 * @typeParam C Configuration type, extending {@link ApiClientConfig}.
 * @typeParam NC Network client type, extending {@link ApiClientNetworkClient}.
 */
export abstract class ApiClient<
  C extends ApiClientConfig = ApiClientConfig, 
  NC extends ApiClientNetworkClient = ApiClientNetworkClient
>
{
  /**
   * Immutable configuration snapshot for this client instance.
   * Accessible to subclasses only.
   */
  protected readonly _config: Readonly<C>;

  /**
   * The `@hey-api` network client bound to this instance.
   * Injected into every operation call. Accessible to subclasses only.
   */
  protected readonly _client: NC;

  /** Whether debug logging is enabled for this client. */
  public get debug(): boolean {
    return this._config.debug ?? false;
  }

  /** The configured client name, or `'API Client'` when unset. */
  public get name(): string {
    return this._config.name ?? 'API Client';
  }

  /** The underlying network client used to perform operations. */
  public get client(): NC
  {
    return this._client;
  }

  /**
   * @param config Immutable client configuration.
   * @param client Network client used to perform operations; receives logging interceptors when `config.debug` is set.
   */
  public constructor(config: C, client: NC) {
    this._config = config;
    this._client = client;

    if (this._config.debug) {
      const name = this._config.name ?? 'API Client';
      this._client.interceptors.request.use(async (request) => {
        console.log(`🔍 [${ name }] Sending ${request.method} request to ${request.url}`)
        return request
      })
      this._client.interceptors.response.use((response, request) => {
        console.log(`✨ [CMS API] Received response ${response.status} ${response.statusText} of type ${response.headers.get('Content-Type') ?? 'unknown'} for ${request.url}`)
        return response
      })
    }
  }

  /**
   * Type guard for a hey-api error result (an object carrying `error`,
   * `request` and `response`).
   *
   * @param toTest The value to inspect.
   * @returns `true` when `toTest` is an error response.
   */
  public isErrorResponse(toTest?: unknown): toTest is { error: unknown; request: Request; response: Response; }
  {
    if (!this.isObject(toTest))
      return false;
    return toTest.error && toTest.request && toTest.response ? true : false;
  }

  /**
   * Type guard for a hey-api success result (an object carrying `data`,
   * `request` and `response`).
   *
   * @param toTest The value to inspect.
   * @returns `true` when `toTest` is a data response.
   */
  public isDataResponse<RT = unknown>(toTest?: unknown): toTest is { data: RT & {}; request: Request; response: Response; }
  {
    if (!this.isObject(toTest))
      return false;
    return toTest.data && toTest.request && toTest.response ? true : false;
  }

  /**
   * Type guard for a non-null object.
   *
   * @param toTest The value to inspect.
   * @returns `true` when `toTest` is a non-null object.
   */
  protected isObject(toTest?: unknown): toTest is Record<string | number | symbol, unknown>
  {
    return typeof toTest === 'object' && toTest !== null
  }
}

/**
 * Error thrown when an API operation returns an error result. Wraps the
 * originating error payload together with the HTTP request and response for
 * inspection.
 */
export class ApiError extends Error {
  /** Raw error context captured from the failed operation: the error payload and the originating HTTP request and response. */
  protected _ctx: { error?: unknown, request?: Request, response?: Response }

  /**
   * @param data The operation error context: the error payload plus the HTTP request and response. A string error is used verbatim as the message; otherwise the message is derived from the response status.
   */
  constructor(data: { error?: unknown, request?: Request, response?: Response }) {
    if (typeof data.error == 'string')
      super(data.error)
    else
      super(`Optimizely CMS API Error: ${data.response?.status ?? 500} ${data.response?.statusText ?? 'Unknown error'}`)
    this._ctx = data;
  }

  /** The error payload returned by the operation. */
  public get data(): unknown {
    return this._ctx.error
  }

  /**
   * @deprecated Use {@link data} instead.
   */
  public get body(): unknown {
    return this._ctx.error
  }

  /** The HTTP request that produced the error. */
  public get request(): Request | undefined {
    return this._ctx.request
  }

  /** The HTTP response that produced the error. */
  public get response(): Response | undefined {
    return this._ctx.response
  }

  /** The HTTP status code of the response. */
  public get status(): number {
    return this._ctx.response?.status ?? 500
  }

  /** The HTTP status text of the response. */
  public get statusText(): string {
    return this._ctx.response?.statusText ?? 'Unknown error'
  }
}