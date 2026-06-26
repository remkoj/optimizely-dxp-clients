/**
 * Utility function to extract all functions from a dictionary. This is typically used
 * with the hey-api sdk. 
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
 * Easily create a derived class defintion from a class with a
 * mixin applied.
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