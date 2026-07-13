/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Represents a HTML hyperlink with URL, display text, and optional rendering properties.
 */
export type Link = {
    /**
     * The URL that the link points to.
     */
    url?: string | null;
    /**
     * Specifies how the URL should be displayed in the browsing context (e.g., '_blank' for new window, '_self' for current window).
     */
    target?: string;
    /**
     * The title text or tooltip displayed when hovering over the link.
     */
    title?: string;
    /**
     * The visible text or label displayed to users for this link.
     */
    text?: string;
    /**
     * Additional attributes associated with the link.
     */
    attributes?: Record<string, string>;
};

