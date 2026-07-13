/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplicationHostTypePatch } from './ApplicationHostTypePatch';
import type { UrlSchemePatch } from './UrlSchemePatch';
/**
 * Represents a host entry for an Application.
 */
export type ApplicationHostPatch = {
    /**
     * The DNS host name or IP address and optional port of this host.
     */
    authority?: string | null;
    type?: ApplicationHostTypePatch;
    /**
     * The locale associated with this host.
     */
    locale?: string | null;
    preferredUrlScheme?: UrlSchemePatch;
};

