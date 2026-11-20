/**
 * Check whether the SDK is allowed to write to stdout. Output is only allowed
 * when `NODE_ENV` is not `production` or when debug logging has been enabled
 * through `OPTIMIZELY_DEBUG` (or `DXP_DEBUG`). Output to stderr
 * (`console.error`, `console.warn` and `console.trace`) is not governed by this.
 *
 * @returns   `true` when writing to stdout is allowed
 */
export function isLoggingEnabled(): boolean {
  try {
    if (process.env.NODE_ENV != 'production')
      return true
    const debug = process.env.OPTIMIZELY_DEBUG ?? process.env.DXP_DEBUG
    return debug != undefined && (debug == '1' || debug.toLowerCase() == 'true')
  } catch {
    return true
  }
}

/**
 * Console wrapper for the SDK output that is written to stdout, that only
 * writes when {@link isLoggingEnabled} is `true`. The environment is evaluated
 * on every call, so changes to the environment are picked up immediately.
 */
export const logger = {
  /** Write a message to `console.log` when logging is enabled */
  log: (...args: Array<unknown>): void => {
    if (isLoggingEnabled()) console.log(...args)
  },
  /** Write a message to `console.info` when logging is enabled */
  info: (...args: Array<unknown>): void => {
    if (isLoggingEnabled()) console.info(...args)
  },
  /** Write a message to `console.debug` when logging is enabled */
  debug: (...args: Array<unknown>): void => {
    if (isLoggingEnabled()) console.debug(...args)
  }
} as const

export default logger
