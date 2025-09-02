export function typeToSlug(baseType: string) {
  let baseTypeSlug = baseType.toLowerCase()
  if (baseTypeSlug.startsWith('_'))
    baseTypeSlug = baseTypeSlug.substring(1)
  return baseTypeSlug
}