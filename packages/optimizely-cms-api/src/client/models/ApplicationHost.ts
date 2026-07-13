/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationHostType } from './ApplicationHostType';
import type { UrlScheme } from './UrlScheme';
/**
 * Represents a host entry for an Application.
 */
export type ApplicationHost = {
    /**
     * The DNS host name or IP address and optional port of this host.
     */
    authority: string;
    type?: ApplicationHostType;
    /**
     * The locale associated with this host.
     */
    locale?: string;
    preferredUrlScheme?: UrlScheme;
};

