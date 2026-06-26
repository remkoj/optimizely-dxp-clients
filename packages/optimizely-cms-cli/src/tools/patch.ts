import { diff } from 'deep-object-diff'

type Primitive = string | number | boolean | bigint | symbol | null | undefined

type DiffValue<T> =
  T extends Primitive ? T | undefined :
    T extends Array<infer U> ? Array<DiffValue<U>> | undefined :
      T extends object ? { [K in keyof T]?: DiffValue<T[K]> } | undefined :
  T | undefined

type MergePatchValue<T> =
  T extends Primitive ? Exclude<T, undefined> | null :
    T extends Array<infer U> ? Array<MergePatchValue<U>> | null :
      T extends object ? MergePatch<T> | null :
  Exclude<T, undefined> | null

/**
 * A JSON Merge Patch object (RFC 7396) for type `T`.
 *
 * Each property is optional. A property set to `null` signals deletion;
 * a property with a value signals addition or replacement;
 * an absent property means no change.
 */
export type MergePatch<T extends object> = {
  [K in keyof T]?: MergePatchValue<T[K]>
}

/**
 * Options for {@link generatePatch}.
 *
 * @template T - The type of the objects being compared.
 */
export type PatchOptions<T extends object> = {
  /** Keys of `T` that should never appear in the generated patch, even if they changed. */
  readonlyFields?: Array<keyof T>
  /** Keys of `T` that must always be included in the generated patch using values from `newValue`. */
  requiredFields?: Array<keyof T>
}

function normalizeMergePatch<T>(
  value: DiffValue<T>,
  omitKeys: Array<keyof T>,
  requiredKeys: Array<keyof T> = [],
  requiredSource?: T
): MergePatchValue<T> {
  if (value === undefined || value === null)
    return null as MergePatchValue<T>

  if (Array.isArray(value))
    return value.map(item => normalizeMergePatch<T>(item as DiffValue<T>, omitKeys)) as MergePatchValue<T>

  if (typeof value !== 'object')
    return value as MergePatchValue<T>

  const output = Object.entries(value).reduce((acc, [ key, entry ]) => {
    if (!omitKeys.includes(key as keyof T))
      acc[key] = normalizeMergePatch<T>(entry as DiffValue<T>, omitKeys)
    return acc
  }, {} as MergePatchValue<T>)

  const withRequiredKeys = requiredKeys.reduce((acc, key) => {
    if (requiredSource && !Object.keys(acc).includes(key as string))
      acc[key as string] = requiredSource[key]
    return acc
  }, output)

  return withRequiredKeys as MergePatchValue<T>
}

/**
 * Computes a JSON Merge Patch (RFC 7396) that transforms `currentValue` into `newValue`.
 *
 * The resulting patch can be sent directly as the request body of an `application/merge-patch+json`
 * request. Changed and added properties are included with their new value; removed properties are
 * included with a `null` value (as required by RFC 7396); unchanged properties are omitted entirely.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7396
 *
 * @example Basic usage
 * ```ts
 * const current = { name: 'Alice', age: 30, role: 'user' }
 * const updated = { name: 'Alice', age: 31 }
 *
 * generatePatch(current, updated)
 * // => { age: 31, role: null }
 * //   `age` is replaced, `role` is removed (null), `name` is unchanged (omitted)
 * ```
 *
 * @example Excluding keys from the patch
 * ```ts
 * const current = { id: '123', name: 'Alice', version: 1 }
 * const updated = { id: '123', name: 'Bob',   version: 2 }
 *
 * generatePatch(current, updated, { readonlyFields: ['id', 'version'] })
 * // => { name: 'Bob' }
 * //   `id` and `version` are excluded even though they are present in the diff
 * ```
 *
 * @example Always include required fields
 * ```ts
 * const current = { id: '123', name: 'Alice', version: 1 }
 * const updated = { id: '123', name: 'Alice', version: 2 }
 *
 * generatePatch(current, updated, { requiredFields: ['id'] })
 * // => { id: '123', version: 2 }
 * //   `id` is included even though it did not change
 * ```
 *
 * @example Nested objects
 * ```ts
 * const current = { address: { city: 'Amsterdam', zip: '1000AA' } }
 * const updated = { address: { city: 'Utrecht' } }
 *
 * generatePatch(current, updated)
 * // => { address: { city: 'Utrecht', zip: null } }
 * ```
 *
 * @param currentValue - The current state of the resource.
 * @param newValue     - The desired state of the resource.
 * @param options      - Optional configuration.
 * @param options.readonlyFields - Keys that should never appear in the generated patch,
 *                           regardless of whether they changed.
 * @param options.requiredFields - Keys that should always appear in the generated patch,
 *                           using values from `newValue`.
 * @returns A {@link MergePatch} object ready to be serialised as an `application/merge-patch+json` body.
 */
export function generatePatch<T extends object>(
  currentValue: T,
  newValue: T,
  options: PatchOptions<T> = {}
): MergePatch<T> {
  const requiredKeys: Array<keyof T> = options.requiredFields ?? []
  const omitKeys: Array<keyof T> = (options.readonlyFields ?? []).filter(key => !requiredKeys.includes(key))
  const patch = diff(currentValue, newValue) as DiffValue<T>
  return normalizeMergePatch<T>(patch, omitKeys, requiredKeys, newValue) as MergePatch<T>
}

/**
 * Extracts all field paths from a {@link MergePatch} as dot-separated strings.
 * Nested objects are flattened recursively; leaf values (including `null`) produce a path entry.
 *
 * @example
 * ```ts
 * getPatchFields({ a: { b: 0 }, c: 'value' })
 * // => ['a.b', 'c']
 * ```
 *
 * @param patch  - The merge patch to extract fields from.
 * @param prefix - Internal prefix used during recursion; omit when calling directly.
 * @returns An array of dot-separated field path strings.
 */
export function getPatchFields<T extends object>(patch: MergePatch<T>, prefix: string = ''): string[] {
  return Object.entries(patch).flatMap(([ key, value ]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? getPatchFields(value as MergePatch<object>, path)
      : [ path ]
  })
}
