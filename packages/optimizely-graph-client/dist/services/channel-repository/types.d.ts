import type { ContentLink } from '../types.js';
export type ChannelDomain = {
    name: string;
    isPrimary: boolean;
    isEdit: boolean;
    forLocale?: string;
};
export type ChannelLocale = {
    code: string;
    slug: string;
    graphLocale: string;
    isDefault: boolean;
};
export type ChannelContent = {
    startPage: ContentLink;
};
export type ChannelDefinitionData = {
    id: string;
    name: string;
    domains: ChannelDomain[];
    locales: ChannelLocale[];
    content: ChannelContent;
};
export type ReadonlyChannelDefinitionData = {
    readonly id: string;
    readonly name: string;
    readonly domains: Array<Readonly<ChannelDomain>>;
    readonly locales: Array<Readonly<ChannelLocale>>;
    readonly content: Readonly<ChannelContent>;
};
