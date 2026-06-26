export type { OperationsList } from './types';
import type { ApiClientConfig, ApiClientFunctions, ClassWithMixin, OperationsList } from './types';
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
 */
export declare function withOperations<TBase extends ApiClientStatic, TOperations extends OperationsList>(Base: TBase, Operations: TOperations): ClassWithMixin<TBase, ApiClientFunctions<TOperations>>;
/**
 * Minimal network client contract required by {@link ApiClient}: a client
 * exposing request and response interceptor registration (as provided by
 * `@hey-api/client-fetch`).
 */
export type ApiClientNetworkClient = {
    interceptors: {
        request: {
            use: (interceptor: (request: Request) => Request | Promise<Request>) => number;
        };
        response: {
            use: (interceptor: (response: Response, request: Request) => Response | Promise<Response>) => number;
        };
    };
};
/**
 * The static (constructor) side of an {@link ApiClient} subclass. Used as the
 * `Base` constraint for {@link withOperations} so a concrete client class can be
 * passed despite its narrowed constructor signature.
 *
 * @typeParam C Configuration type, extending {@link ApiClientConfig}.
 * @typeParam NC Network client type, extending {@link ApiClientNetworkClient}.
 */
export type ApiClientStatic<C extends ApiClientConfig = ApiClientConfig, NC extends ApiClientNetworkClient = ApiClientNetworkClient> = {
    new (...args: any[]): ApiClient<C, NC>;
};
/**
 * Abstract base for hey-api backed clients. Holds the immutable configuration
 * and network client, and—when `debug` is enabled—installs request/response
 * logging interceptors. Operation methods are added by {@link withOperations}.
 *
 * @typeParam C Configuration type, extending {@link ApiClientConfig}.
 * @typeParam NC Network client type, extending {@link ApiClientNetworkClient}.
 */
export declare abstract class ApiClient<C extends ApiClientConfig = ApiClientConfig, NC extends ApiClientNetworkClient = ApiClientNetworkClient> {
    /**
     * The configuration of this ApiClient instance, only
     * available to implementations of the API Client.
     */
    protected readonly _config: Readonly<C>;
    /**
     * Get the network client that is needed to perform operations
     */
    protected readonly _client: NC;
    /** Whether debug logging is enabled for this client. */
    protected get debug(): boolean;
    /** The configured client name, or `'API Client'` when unset. */
    get name(): string;
    /** The underlying network client used to perform operations. */
    get client(): NC;
    /**
     * @param config Immutable client configuration.
     * @param client Network client used to perform operations; receives logging interceptors when `config.debug` is set.
     */
    constructor(config: C, client: NC);
    /**
     * Type guard for a hey-api error result (an object carrying `error`,
     * `request` and `response`).
     *
     * @param toTest The value to inspect.
     * @returns `true` when `toTest` is an error response.
     */
    protected isErrorResponse(toTest?: unknown): toTest is {
        error: unknown;
        request: Request;
        response: Response;
    };
    /**
     * Type guard for a hey-api success result (an object carrying `data`,
     * `request` and `response`).
     *
     * @param toTest The value to inspect.
     * @returns `true` when `toTest` is a data response.
     */
    protected isDataResponse<RT = unknown>(toTest?: unknown): toTest is {
        data: RT & {};
        request: Request;
        response: Response;
    };
    /**
     * Type guard for a non-null object.
     *
     * @param toTest The value to inspect.
     * @returns `true` when `toTest` is a non-null object.
     */
    protected isObject(toTest?: unknown): toTest is Record<string | number | symbol, unknown>;
}
/**
 * Error thrown when an API operation returns an error result. Wraps the
 * originating error payload together with the HTTP request and response for
 * inspection.
 */
export declare class ApiError extends Error {
    protected _ctx: {
        error?: unknown;
        request?: Request;
        response?: Response;
    };
    /**
     * @param data The operation error context: the error payload plus the HTTP request and response. A string error is used verbatim as the message; otherwise the message is derived from the response status.
     */
    constructor(data: {
        error?: unknown;
        request?: Request;
        response?: Response;
    });
    /** The error payload returned by the operation. */
    get data(): unknown;
    /**
     * @deprecated use data() instead
     */
    get body(): unknown;
    /** The HTTP request that produced the error. */
    get request(): unknown;
    /** The HTTP response that produced the error. */
    get response(): unknown;
    /** The HTTP status code of the response. */
    get status(): number;
    /** The HTTP status text of the response. */
    get statusText(): string;
}
