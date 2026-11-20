const MASK = '********'
const MIN_LENGTH_TO_REVEAL = 8
const MAX_REVEALED = 4

/**
 * Create a display-safe version of a secret value, to be used as the
 * `defaultDescription` of a CLI option. It shows at most the first four
 * characters (a quarter of the value, and none for values shorter than eight
 * characters) followed by a fixed length mask, so the value can be recognized
 * without being exposed and its length is not revealed.
 *
 * @param     value   The secret value
 * @returns   The masked value, or `undefined` when there is no value to mask
 */
export function maskSecret(value: string | null | undefined): string | undefined {
  if (!value)
    return undefined
  const revealed = value.length < MIN_LENGTH_TO_REVEAL ? 0 : Math.min(MAX_REVEALED, Math.floor(value.length / 4))
  return value.substring(0, revealed) + MASK
}

export default maskSecret
