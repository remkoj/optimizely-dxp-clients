export type Route = {
    locale: string
    path: string
    url: URL
    slug: string
    changed: Date | null
    contentType: string[]
    version?: string | null
    key: string
}