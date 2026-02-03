/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Represents a content component.
 */
export type ContentComponent = {
    /**
     * An optional display option for the content component.
     */
    displayOption?: string | null;
    /**
     * An optional group for the personalizable component.
     */
    segmentationGroup?: string | null;
    /**
     * Specifies the settings for the content component.
     */
    segments?: Array<string> | null;
    /**
     * The display name of the content component. If Reference is set, the name is automatically set to the name of the referenced content.
     */
    name?: string | null;
    reference?: string;
    /**
     * The key of the content type that this is an embedded instance of.
     */
    contentType?: string | null;
    /**
     * Dictionary with all custom properties as specified by associated ContentType
     */
    content?: any;
};

