import type { GenericContext, TransferrableContext, BaseContext } from "./types.js";
import { isOptiGraphConfig } from "@remkoj/optimizely-graph-client";

const ClientReferenceType = Symbol.for('react.client.reference')

/**
 * Check if the provided component is a reference to a Client Component, as seen
 * from a React Server Component.
 *
 * @param     component     The component to check
 * @returns   `true` when the component is a Client Component reference
 */
export function isClientReference(component: unknown): boolean {
  return (typeof component == 'function' || (typeof component == 'object' && component != null)) &&
    (component as { $$typeof?: symbol }).$$typeof === ClientReferenceType
}

/**
 * Get the context in the form that can be passed to the provided component as
 * `ctx`. Client Components cannot receive class instances (and React does not
 * support objects with a `toJSON` method) across the Server/Client boundary,
 * so for these the transferrable context is returned. For all other components
 * the context is returned as-is.
 *
 * @param     target    The component that will receive the context
 * @param     ctx       The context to hand over
 * @returns   The context, or its transferrable form when `target` is a Client Component
 */
export function toComponentContext(target: unknown, ctx: GenericContext): GenericContext
export function toComponentContext(target: unknown, ctx: GenericContext | undefined): GenericContext | undefined
export function toComponentContext(target: unknown, ctx: GenericContext | undefined): GenericContext | undefined {
  if (ctx && isClientReference(target) && typeof (ctx as { toJSON?: unknown }).toJSON == 'function')
    return (ctx as unknown as { toJSON: () => TransferrableContext }).toJSON() as unknown as GenericContext
  return ctx
}

/**
 * Get the serializable form of the provided context. Contexts that implement
 * `toJSON` (like the `ServerContext`) are converted, anything else is returned
 * as-is.
 *
 * @param     ctx     The context to convert
 * @returns   The serializable context
 */
export function toSerializableContext<T>(ctx: T): T {
  if (typeof ctx == 'object' && ctx != null && typeof (ctx as { toJSON?: unknown }).toJSON == 'function')
    return (ctx as unknown as { toJSON: () => T }).toJSON()
  return ctx
}

/**
 * Check if the provided context is the transferrable (serializable) context
 *
 * @param     ctxIn     The context to check
 * @returns   `true` when the context is a `TransferrableContext`
 */
export function isTransferrableContext(ctxIn?: BaseContext | null): ctxIn is TransferrableContext {
  return typeof (ctxIn) == 'object' && ctxIn != null && (ctxIn as GenericContext).factory === undefined && isOptiGraphConfig(ctxIn.client)
}

export function isGenericContext(ctxIn?: BaseContext | null): ctxIn is GenericContext {
  return typeof (ctxIn) == 'object' && ctxIn != null && typeof (ctxIn as GenericContext).factory == 'object' && (ctxIn as GenericContext).factory != null
}

