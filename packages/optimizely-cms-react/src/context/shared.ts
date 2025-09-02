import type { GenericContext, TransferrableContext, BaseContext } from "./types.js";
import { isOptiGraphConfig } from "@remkoj/optimizely-graph-client";

export function isTransferrableContext(ctxIn?: BaseContext | null): ctxIn is TransferrableContext {
  return typeof (ctxIn) == 'object' && ctxIn != null && (ctxIn as GenericContext).factory === undefined && isOptiGraphConfig(ctxIn.client)
}

export function isGenericContext(ctxIn?: BaseContext | null): ctxIn is GenericContext {
  return typeof (ctxIn) == 'object' && ctxIn != null && typeof (ctxIn as GenericContext).factory == 'object' && (ctxIn as GenericContext).factory != null
}

