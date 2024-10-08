/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Instruction for generating an alternative image from the main binary of an image content item.
 */
export type ImageDescriptor = {
    /**
     * The image width in pixels.
     */
    width?: number;
    /**
     * The image height in pixels.
     */
    height?: number;
    /**
     * Indicates if the image should be pregenerated when a new image is uploaded rather than when first requested.
     */
    pregenerated?: boolean;
};

