/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Represents a content component.
 */
export type ContentComponent = {
    /**
     * The name of the content component. If Reference is set, the name is automatically set to the name of the referenced content.
     */
    name?: string;
    /**
     * An optional display option for the content component.
     */
    displayOption?: string;
    /**
     * An optional group for the personalizable component.
     */
    segmentationGroup?: string;
    /**
     * Specifies the settings for the content component.
     */
    segments?: Array<string>;
    /**
     * A reference to the content of this component.
     * Cannot be assigned together with Content.
     */
    reference?: string;
    /**
     * The key of the content type that this is an embedded instance of.
     */
    contentType?: string;
    /**
     * Dictionary with all custom properties as specified by associated ContentType
     */
    content?: any;
};

