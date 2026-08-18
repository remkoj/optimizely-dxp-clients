/**
 * Check whether debug logging has been enabled through the `OPTIMIZELY_DEBUG`
 * or `DXP_DEBUG` environment variables.
 *
 * @returns   `true` when debug logging is enabled
 */
export function isDebug() : boolean
{
  try {
    const value = process?.env?.OPTIMIZELY_DEBUG ?? process?.env?.DXP_DEBUG
    return value ? value == '1' || value.toLowerCase() == 'true' : false
  } catch {
    return false;
  }
}

/**
 * Check whether the application is running with `NODE_ENV` set to `development`.
 *
 * @returns   `true` when running in development mode
 */
export function isDevelopment() : boolean
{
  try {
    return process.env.NODE_ENV == 'development'
  } catch {
    return false;
  }
}