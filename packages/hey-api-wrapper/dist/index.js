"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = exports.ApiClient = void 0;
exports.withOperations = withOperations;
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
function withOperations(Base, Operations) {
    //@ts-expect-error A mixin requires an ...any[] argument, but our concrete class has
    // specified 
    class NewClass extends Base {
        constructor(...args) {
            super(...args);
        }
    }
    // Create guard for this list of Operations
    const isApiClientFunction = createIsFunctionValidator(Operations);
    // Bind the operations
    ;
    Object.getOwnPropertyNames(Operations).filter(isApiClientFunction).forEach(propName => {
        async function wrapper(...args) {
            const operationArgs = [...args];
            operationArgs[0] = {
                throwOnError: false,
                ...args,
                client: this._client
            };
            //@ts-expect-error TypeScript can't check this as TOperations is dynamic
            const result = await Operations[propName](...operationArgs);
            if (result.error)
                throw new ApiError(result);
            return result.data ? result.data : result;
        }
        //@ts-expect-error TypeScript doesn't understand that we're creating an expected function
        NewClass.prototype[propName] = wrapper;
    });
    // Return the new class
    return NewClass;
}
/**
 * Builds a type guard that reports whether a property name refers to a function
 * on the given operations map, narrowing it to `keyof T`.
 *
 * @param baseType The operations map to test property names against.
 * @returns A predicate that is `true` for keys whose value is a function.
 */
function createIsFunctionValidator(baseType) {
    return (propName) => {
        return typeof (baseType[propName]) == 'function';
    };
}
/**
 * Abstract base for hey-api backed clients. Holds the immutable configuration
 * and network client, and—when `debug` is enabled—installs request/response
 * logging interceptors. Operation methods are added by {@link withOperations}.
 *
 * @typeParam C Configuration type, extending {@link ApiClientConfig}.
 * @typeParam NC Network client type, extending {@link ApiClientNetworkClient}.
 */
class ApiClient {
    /**
     * The configuration of this ApiClient instance, only
     * available to implementations of the API Client.
     */
    _config;
    /**
     * Get the network client that is needed to perform operations
     */
    _client;
    /** Whether debug logging is enabled for this client. */
    get debug() {
        return this._config.debug ?? false;
    }
    /** The configured client name, or `'API Client'` when unset. */
    get name() {
        return this._config.name ?? 'API Client';
    }
    /** The underlying network client used to perform operations. */
    get client() {
        return this._client;
    }
    /**
     * @param config Immutable client configuration.
     * @param client Network client used to perform operations; receives logging interceptors when `config.debug` is set.
     */
    constructor(config, client) {
        this._config = config;
        this._client = client;
        if (this._config.debug) {
            const name = this._config.name ?? 'API Client';
            this._client.interceptors.request.use(async (request) => {
                console.log(`🔍 [${name}] Sending ${request.method} request to ${request.url}`);
                return request;
            });
            this._client.interceptors.response.use((response, request) => {
                console.log(`✨ [CMS API] Received response ${response.status} ${response.statusText} of type ${response.headers.get('Content-Type') ?? 'unknown'} for ${request.url}`);
                return response;
            });
        }
    }
    /**
     * Type guard for a hey-api error result (an object carrying `error`,
     * `request` and `response`).
     *
     * @param toTest The value to inspect.
     * @returns `true` when `toTest` is an error response.
     */
    isErrorResponse(toTest) {
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
    isDataResponse(toTest) {
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
    isObject(toTest) {
        return typeof toTest === 'object' && toTest !== null;
    }
}
exports.ApiClient = ApiClient;
/**
 * Error thrown when an API operation returns an error result. Wraps the
 * originating error payload together with the HTTP request and response for
 * inspection.
 */
class ApiError extends Error {
    _ctx;
    /**
     * @param data The operation error context: the error payload plus the HTTP request and response. A string error is used verbatim as the message; otherwise the message is derived from the response status.
     */
    constructor(data) {
        if (typeof data.error == 'string')
            super(data.error);
        else
            super(`Optimizely CMS API Error: ${data.response?.status ?? 500} ${data.response?.statusText ?? 'Unknown error'}`);
        this._ctx = data;
    }
    /** The error payload returned by the operation. */
    get data() {
        return this._ctx.error;
    }
    /**
     * @deprecated use data() instead
     */
    get body() {
        return this._ctx.error;
    }
    /** The HTTP request that produced the error. */
    get request() {
        return this._ctx.request;
    }
    /** The HTTP response that produced the error. */
    get response() {
        return this._ctx.response;
    }
    /** The HTTP status code of the response. */
    get status() {
        return this._ctx.response?.status ?? 500;
    }
    /** The HTTP status text of the response. */
    get statusText() {
        return this._ctx.response?.statusText ?? 'Unknown error';
    }
}
exports.ApiError = ApiError;
//# sourceMappingURL=index.js.map