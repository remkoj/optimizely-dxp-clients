export type ContentLink = {
  key: string
  version?: string | null,
  isInline?: boolean
}

export type InlineContentLink = {
  key?: null | ""
  version?: null
  isInline?: true
}

export type ContentLinkWithLocale<LocaleType = string> = ContentLink & { locale?: LocaleType }
export type InlineContentLinkWithLocale<LocaleType = string> = InlineContentLink & { locale?: LocaleType }