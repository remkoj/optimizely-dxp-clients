export type ContentLink = {
  key: string
  version?: string | null,
  isInline?: boolean
  variation?: string | null
  changeset?: string | null
}

export type InlineContentLink = {
  key?: null | ""
  version?: null
  isInline?: true
  variation?: string | null
  changeset?: string | null
}

export type ContentLinkWithLocale<LocaleType = string> = ContentLink & { locale?: LocaleType }
export type InlineContentLinkWithLocale<LocaleType = string> = InlineContentLink & { locale?: LocaleType }