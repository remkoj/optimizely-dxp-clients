export function ucFirst<S extends string>(input: S): Capitalize<S> {
  return (input.substring(0, 1).toUpperCase() + input.substring(1)) as Capitalize<S>;
}

export function lcFirst<S extends string>(input: S): Uncapitalize<S> {
  return (input.substring(0, 1).toLowerCase() + input.substring(1)) as Uncapitalize<S>;
}

export function trimStart(target: string, toTrim: string = ' '): string {
  const regex = new RegExp(`/^(${toTrim})+/`)
  return target.replace(regex, '')
}