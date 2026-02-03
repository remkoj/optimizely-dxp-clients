/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CompositionDisplaySettings } from './CompositionDisplaySettings';
/**
 * Specifies a node in a content composition.
 */
export type CompositionNode = {
    /**
     * Specifies the id of this CompositionNode.
     */
    id?: string | null;
    /**
     * The display name of this ContentType.
     */
    displayName?: string | null;
    /**
     * Gets the node type of this CompositionNode.
     */
    readonly nodeType?: string;
    /**
     * Gets the node layout type of this CompositionNode
     */
    readonly layoutType?: string | null;
    displaySettings?: CompositionDisplaySettings;
    /**
     * Represents a content component.
     */
    component?: {
        /**
         * Dictionary with all custom properties as specified by associated ContentType
         */
        properties?: any;
        reference?: string;
        /**
         * The key of the content type that this is an embedded instance of.
         */
        contentType?: string | null;
    };
    /**
     * Gets the available child nodes for this CompositionNode.
     */
    nodes?: Array<CompositionNode> | null;
};

