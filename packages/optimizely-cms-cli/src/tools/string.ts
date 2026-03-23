export function ucFirst(current: string) : string {
    if (typeof current != 'string')
        throw new Error("Only strings can be transformed")
    if (current == "")
        return current
    return current[0]?.toUpperCase() + current.substring(1)
}

export function trimLeadingUnderscore(value: string): string
export function trimLeadingUnderscore(value?: null): undefined | null
export function trimLeadingUnderscore(value?: string | null): string | undefined | null
{
  return value?.startsWith('_') ? value.substring(1) : value
}
