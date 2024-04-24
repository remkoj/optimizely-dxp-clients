import { CompositionNode, CompositionElementNode, CompositionStructureNode } from './types';
export declare function isElementNode(node: CompositionNode<Record<string, any>>): node is CompositionElementNode<Record<string, any>>;
export declare function isElementNodeOfType<ET extends Record<string, any>>(node: CompositionNode<Record<string, any>>, test: (data: Record<string, any>) => data is ET): node is CompositionElementNode<ET>;
export declare function isStructureNode(node: CompositionNode<Record<string, any>>): node is CompositionStructureNode;
export declare function isNode(toTest: any): toTest is CompositionNode;
