import type { TransformOptions } from "../types"

/** Default values applied when `TransformOptions` properties are absent. */
export const defaultOptions: Readonly<Required<TransformOptions>> = {
  injections: [],
  verbose: false,
  recursion: true,
  cleanup: true,
  cmsClient: {}
}

/**
 * Extract `TransformOptions`-relevant properties from a raw options object,
 * merging them with `defaultOptions`.
 */
export function pickTransformOptions(options: Record<string, any>): Readonly<Required<TransformOptions>> {
  return {
    cleanup: options.cleanup ?? true,
    injections: options.injections ?? [],
    verbose: options.verbose ?? false,
    recursion: options.recursion ?? true,
    cmsClient: options.cmsClient ?? undefined
  }
}