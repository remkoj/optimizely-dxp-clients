export type ContentLink = {
    key: string
    version?: string | null, 
}

export type InlineContentLink = {
    key: null
    version?: null
}

export type ContentLinkWithLocale<LocaleType = string> = ContentLink & { locale?: LocaleType }
export type InlineContentLinkWithLocale<LocaleType = string> = InlineContentLink & { locale?: LocaleType }