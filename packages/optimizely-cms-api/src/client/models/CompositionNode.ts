/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CompositionDisplaySettings } from './CompositionDisplaySettings';
import type { ContentComponent } from './ContentComponent';
/**
 * Specifies a node in a content composition.
 */
export type CompositionNode = {
    /**
     * Specifies an identifier of this CompositionNode.
     */
    id?: string;
    /**
     * The display name of this ContentType.
     */
    displayName?: string;
    /**
     * The node type of this CompositionNode.
     */
    nodeType: string;
    /**
     * The node layout type of this CompositionNode
     */
    layoutType?: string;
    displaySettings?: CompositionDisplaySettings;
    component?: ContentComponent;
    /**
     * The child nodes for this CompositionNode.
     */
    nodes?: Array<CompositionNode> | null;
};

