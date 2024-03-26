"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transform = exports.pickTransformOptions = void 0;
const graphql_1 = require("graphql");
function pickTransformOptions(options) {
    return {
        injections: options.injections ?? []
    };
}
exports.pickTransformOptions = pickTransformOptions;
function isArray(toTest) { return Array.isArray(toTest); }
const transform = async ({ documents: files, config }) => {
    //console.log("[STARTED] Optimizely document transformation")
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
            "FragmentDefinition": {
                enter(node) {
                    const matchingInjections = applicableInjections.filter(injection => !injection.nameRegex || (new RegExp(injection.nameRegex)).test(node.name.value));
                    if (!matchingInjections || matchingInjections.length == 0)
                        return false;
                    matchingInjections.forEach(injection => {
                        //console.log(`[ DEBUG ] Matched ${ node.name.value } for ${ injection.into } in file ${ node.loc?.source?.name }`)
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
    if (intoNames.length == 0)
        return files;
    // Process the fragments, add matching spreads if need be
    const recursiveFragments = ["BlockContentAreaItemSearchData", "BlockContentAreaItemData"];
    const componentSpreads = {};
    intoNames.forEach(intoName => {
        //console.log(`[ DEBUG ] Preparing mutations for ${ intoName }`)
        componentFragments[intoName].forEach(fragment => {
            //console.log(`[ DEBUG ] Preparing mutations for fragment ${ fragment.name.value } within ${ intoName }`)
            (0, graphql_1.visit)(fragment, {
                "FragmentSpread": {
                    leave(node, key, parent, path, ancestors) {
                        if (recursiveFragments.includes(node.name.value) && !isArray(ancestors[0]) && ancestors[0].kind == graphql_1.Kind.FRAGMENT_DEFINITION) {
                            //console.log(`[ DEBUG ] Leaving ${ node.name.value } within  ${ fragment.name.value } for ${ intoName}, creating recursive fragment`)
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
    const newFiles = files.map(file => {
        const document = file.document ? (0, graphql_1.visit)(file.document, {
            SelectionSet: {
                enter(node, key, parent) {
                    if (!isArray(parent) && parent?.kind == graphql_1.Kind.FRAGMENT_DEFINITION && intoNames.includes(parent.name.value)) {
                        const addedSelections = componentFragments[parent.name.value].map(fragment => {
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
                            //console.log("[ DEBUG ] Pushing inline fragment for", parent.name.value)
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
    //console.log("[SUCCESS] Optimizely document transformation")
    return newFiles;
};
exports.transform = transform;
exports.default = { transform: exports.transform };
// The recursive sections to add
const recursiveSelections = (0, graphql_1.parse)(`fragment BlockContentAreaItemData on ContentAreaItemModel {
    item: ContentLink {
        data: Expanded @recursive(depth: 3) {
            __typename
        }
    }
}`).definitions[0]?.selectionSet.selections || [];
//# sourceMappingURL=transform.js.map