/** Capitalise the first character of `input` without changing the rest. */
export function ucFirst<S extends string>(input: S): Capitalize<S> {
  return (input.substring(0, 1).toUpperCase() + input.substring(1)) as Capitalize<S>;
}

/** Lower-case the first character of `input` without changing the rest. */
export function lcFirst<S extends string>(input: S): Uncapitalize<S> {
  return (input.substring(0, 1).toLowerCase() + input.substring(1)) as Uncapitalize<S>;
}

/** Remove all leading occurrences of `toTrim` (default: space) from `target`. */
export function trimStart(target: string, toTrim: string = ' '): string {
  const regex = new RegExp(`/^(${toTrim})+/`)
  return target.replace(regex, '')
}

/** Type-guard: returns `true` when `toTest` is a non-empty string. */
export function isNonEmptyString<S extends string>(toTest: S | null | undefined | object | number | boolean): toTest is S {
  return typeof toTest === 'string' && toTest.length > 0
}