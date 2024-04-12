export type ContentLink = {
    key: string;
    version?: string | null;
};
export type ContentLinkWithLocale<LocaleType = string> = ContentLink & {
    locale?: LocaleType;
};
