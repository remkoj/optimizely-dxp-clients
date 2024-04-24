export function isElementNode(node) {
    return node.type == "element";
}
export function isElementNodeOfType(node, test) {
    if (!isElementNode(node))
        return false;
    return test(node.element);
}
export function isStructureNode(node) {
    return !isElementNode(node);
}
export function isNode(toTest) {
    if (typeof (toTest) != 'object' || toTest == null)
        return false;
    const nodeTypes = ["outline", "grid", "row", "column", "element"];
    const hasValidName = (typeof toTest.name == 'string' && (toTest.name?.length ?? 0) > 0) || toTest.name == null;
    const hasValidType = typeof toTest.type == 'string' && nodeTypes.includes(toTest.type);
    return hasValidName && hasValidType;
}
//# sourceMappingURL=functions.js.map