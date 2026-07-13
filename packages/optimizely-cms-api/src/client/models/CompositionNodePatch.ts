/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CompositionDisplaySettingsPatch } from './CompositionDisplaySettingsPatch';
import type { ContentComponentPatch } from './ContentComponentPatch';
/**
 * Specifies a node in a content composition.
 */
export type CompositionNodePatch = {
    /**
     * Specifies an identifier of this CompositionNode.
     */
    id?: string | null;
    /**
     * The display name of this ContentType.
     */
    displayName?: string | null;
    /**
     * The node type of this CompositionNode.
     */
    nodeType?: string | null;
    /**
     * The node layout type of this CompositionNode
     */
    layoutType?: string | null;
    displaySettings?: CompositionDisplaySettingsPatch;
    component?: ContentComponentPatch;
    /**
     * The child nodes for this CompositionNode.
     */
    nodes?: Array<CompositionNodePatch> | null;
};

