"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transform = exports.pickTransformOptions = void 0;
const graphql_1 = require("graphql");
const node_fs_1 = __importDefault(require("node:fs"));
function pickTransformOptions(options) {
    return {
        injections: options.injections ?? [],
        verbose: options.verbose ?? false,
        recursion: options.recursion ?? true
    };
}
exports.pickTransformOptions = pickTransformOptions;
function isArray(toTest) { return Array.isArray(toTest); }
const transform = ({ documents: files, config, schema, pluginContext }) => {
    const injections = config.injections ?? [];
    // Retrieve component fragments
    const componentFragments = {};
    files.forEach(file => {
        if (!file.document)
            return;
        const applicableInjections = injections.filter(injection => !injection.pathRegex || (new RegExp(injection.pathRegex)).test(file.location ?? ""));
        if (!applicableInjections || applicableInjections.length == 0)
            return;
        (0, graphql_1.visit)(file.document, {
            FragmentDefinition: {
                enter(node) {
                    const matchingInjections = applicableInjections.filter(injection => !injection.nameRegex || (new RegExp(injection.nameRegex)).test(node.name.value));
                    if (!matchingInjections || matchingInjections.length == 0)
                        return false;
                    matchingInjections.forEach(injection => {
                        if (config.verbose)
                            console.debug(`[ OPTIMIZELY ] Found ${node.name.value} for ${injection.into} in file ${node.loc?.source?.name}`);
                        if (!componentFragments[injection.into])
                            componentFragments[injection.into] = [];
                        if (!componentFragments[injection.into].some(f => f.name.value == node.name.value))
                            componentFragments[injection.into].push(node);
                    });
                    return undefined;
                }
            }
        });
    });
    // Get the names we actually need to inject into, and return when none are present
    const intoNames = Object.getOwnPropertyNames(componentFragments);
    // Process recursion
    const componentSpreads = {};
    if (config.recursion && intoNames.length > 0) {
        // Process the fragments, add matching spreads if need be
        const recursiveFragments = ["IContentListItem"];
        intoNames.forEach(intoName => {
            componentFragments[intoName].forEach(fragment => {
                (0, graphql_1.visit)(fragment, {
                    FragmentSpread: {
                        leave(node, key, parent, path, ancestors) {
                            if (recursiveFragments.includes(node.name.value) && !isArray(ancestors[0]) && ancestors[0].kind == graphql_1.Kind.FRAGMENT_DEFINITION) {
                                if (config.verbose)
                                    console.debug(`[ OPTIMIZELY ] Found ${node.name.value} within ${fragment.name.value} for ${intoName}, creating recursive fragment`);
                                const fields = ancestors.filter(a => !isArray(a) && a.kind != graphql_1.Kind.FRAGMENT_DEFINITION && a.kind != graphql_1.Kind.SELECTION_SET);
                                if (fields.length < 1)
                                    return undefined;
                                if (fields.length > 1)
                                    throw new Error("Recursive items on embedded blocks are not supported at the moment");
                                const newNode = {
                                    kind: graphql_1.Kind.INLINE_FRAGMENT,
                                    typeCondition: ancestors[0].typeCondition,
                                    selectionSet: {
                                        kind: graphql_1.Kind.SELECTION_SET,
                                        selections: [{
                                                kind: graphql_1.Kind.FIELD,
                                                name: fields[0].name,
                                                alias: fields[0].alias,
                                                directives: [{
                                                        kind: graphql_1.Kind.DIRECTIVE,
                                                        name: { kind: graphql_1.Kind.NAME, value: "recursive" },
                                                        arguments: [{
                                                                kind: graphql_1.Kind.ARGUMENT,
                                                                name: { kind: graphql_1.Kind.NAME, value: "depth" },
                                                                value: { kind: graphql_1.Kind.INT, value: "5" }
                                                            }]
                                                    }],
                                                selectionSet: {
                                                    kind: graphql_1.Kind.SELECTION_SET,
                                                    selections: recursiveSelections
                                                }
                                            }]
                                    }
                                };
                                if (!componentSpreads[intoName])
                                    componentSpreads[intoName] = [];
                                componentSpreads[intoName].push(newNode);
                            }
                        }
                    }
                });
            });
        });
    }
    // Update the documents
    return files.map(file => {
        const document = file.document ? (0, graphql_1.visit)(file.document, {
            // Remove fragments from the preset, for which the target type does not exist
            FragmentDefinition: {
                enter(node) {
                    if (file.location && !node_fs_1.default.existsSync(file.location)) {
                        const typePresent = schema.definitions.some(definition => (definition.kind == graphql_1.Kind.OBJECT_TYPE_DEFINITION || definition.kind == graphql_1.Kind.INTERFACE_TYPE_DEFINITION) && definition.name.value == node.typeCondition.name.value);
                        if (!typePresent) {
                            if (config.verbose)
                                console.debug(`[OPTIMIZELY] Type ${node.typeCondition.name.value} not found, dropping fragment ${node.name.value}`);
                            return null;
                        }
                    }
                }
            },
            // Add items to the selection sets
            SelectionSet: {
                enter(node, key, parent) {
                    if (!isArray(parent) && parent?.kind == graphql_1.Kind.FRAGMENT_DEFINITION && intoNames.includes(parent.name.value)) {
                        const addedSelections = componentFragments[parent.name.value].map(fragment => {
                            if (config.verbose)
                                console.debug(`[ OPTIMIZELY ] Adding fragment ${fragment.name.value} to ${parent.name.value}`);
                            return {
                                kind: graphql_1.Kind.FRAGMENT_SPREAD,
                                directives: [],
                                name: {
                                    kind: graphql_1.Kind.NAME,
                                    value: fragment.name.value
                                }
                            };
                        });
                        componentSpreads[parent.name.value]?.forEach(spread => {
                            if (config.verbose)
                                console.debug(`[ OPTIMIZELY ] Adding inline fragment for ${spread.typeCondition?.name.value ?? "Untyped"} to ${parent.name.value}`);
                            addedSelections.push(spread);
                        });
                        return {
                            ...node,
                            selections: [
                                ...node.selections,
                                ...addedSelections
                            ]
                        };
                    }
                    return undefined;
                }
            }
        }) : undefined;
        return {
            ...file,
            document: document,
        };
    });
};
exports.transform = transform;
exports.default = { transform: exports.transform };
// The recursive sections to add
const recursiveSelections = (0, graphql_1.parse)(`fragment IContentListItem on IContent {
    ...IContentData
}`).definitions[0]?.selectionSet.selections || [];
//# sourceMappingURL=transform.js.map