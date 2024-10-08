export function ucFirst(current: string) : string {
    if (typeof current != 'string')
        throw new Error("Only strings can be transformed")
    if (current == "")
        return current
    return current[0]?.toUpperCase() + current.substring(1)
}