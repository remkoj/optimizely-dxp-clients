import type { TransformOptions } from "../types"

export const defaultOptions: Readonly<Required<TransformOptions>> = {
  injections: [],
  verbose: false,
  recursion: true,
  cmsClient: {}
}

export function pickTransformOptions(options: Record<string, any>): Readonly<Required<TransformOptions>> {
  return {
    injections: options.injections ?? [],
    verbose: options.verbose ?? false,
    recursion: options.recursion ?? true,
    cmsClient: options.cmsClient ?? undefined
  }
}