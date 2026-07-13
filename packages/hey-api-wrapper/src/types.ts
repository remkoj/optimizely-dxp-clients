/**
 * Utility function to extract all functions from a dictionary. This is typically used
 * with the hey-api sdk. 
 * 
 * @typeparam Operations The hey-api SDK module shape (e.g. `typeof import('./client/sdk.gen')`).
 *
 * **Example:**
 * ```
 * import * as apiFunctions from './client/sdk.gen';
 * type ApiOperations = OperationsList<typeof apiFunctions>;
 * ```
 */
export type OperationsList<Operations extends Record<string, unknown> = Record<string,unknown>> = { 
  -readonly [KT in keyof Operations as Operations[KT] extends (...args: unknown[]) => unknown ? (KT extends string ? KT : never) : never]: Operations[KT] 
}

/**
 * Normalizes an operation's return type: a hey-api result
 * (`Promise<{ data?, request, response }>`) is reduced to `Promise<TData>`;
 * any other return type is left unchanged.
 */
type OperationReturnType<Op extends (...args: unknown[]) => unknown> =
  ReturnType<Op> extends Promise<{ data?: infer TData }> ?
    Promise<TData> :
    ReturnType<Op>;

/**
 * Convert the extracted SDK functions to the normalized client
 * functions that can be used.
 * 
 * @typeparam L An {@link OperationsList} — the map of hey-api operation functions to convert.
 *
 * **Example:**
 * ```
 * import * as apiFunctions from './client/sdk.gen';
 * type ApiOperations = OperationsList<typeof apiFunctions>;
 * type ClientFunctions = ApiClientFunctions<ApiOperations>;
 * ```
 */
export type ApiClientFunctions<L extends Record<string, (...args: unknown[]) => unknown>> = {
  readonly [KT in keyof L]: (...args: Parameters<L[KT]>) => OperationReturnType<L[KT]>    
}

/** Any class (constructable) type. */
export type ClassDefinition = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): any
}
/** The keys of `T` whose values are not constructors. */
type NonConstructorKeys<T> = ({ [P in keyof T]: T[P] extends new () => object ? never : P })[keyof T];
/** `TBase` with its construct signature removed, leaving only static members. */
type OmitConstructor<TBase extends ClassDefinition> = Pick<TBase, NonConstructorKeys<TBase>>

/**
 * Produces the concrete derived-class type that results from applying a mixin
 * to a base class. The constructor signature matches `TBase`; the instance type
 * is `InstanceType<TBase> & Mixin`.
 *
 * @typeparam TBase The base class being extended (must be constructable).
 * @typeparam Mixin The mixin object type whose members are merged into the instance.
 *
 * **Example:**
 * ```typescript
 * type CmsApiClientClass = ClassWithMixin<typeof ApiClient, ApiClientFunctions<CmsOperations>>;
 * ```
 */
export type ClassWithMixin<TBase extends ClassDefinition, Mixin> = OmitConstructor<TBase> & {
  new(...args: ConstructorParameters<TBase>): InstanceType<TBase> & Mixin
}

/** Base configuration accepted by every {@link ApiClient}. */
export type ApiClientConfig = {
  /** Enables request/response logging interceptors when `true`. */
  debug?: boolean
  /** Optional display name used in log output; defaults to `'API Client'`. */
  name?: string
}