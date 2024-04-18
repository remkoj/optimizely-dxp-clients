import { localeToGraphLocale } from '@remkoj/optimizely-graph-client/utils';
export function isNonEmptyString(toTest) {
    return typeof (toTest) == 'string' && toTest.length > 0;
}
export function isNotNullOrUndefined(toTest) {
    return !(toTest == null || toTest == undefined);
}
export function isContentType(toTest) {
    if (!Array.isArray(toTest))
        return false;
    return toTest.every(isNonEmptyString);
}
export function normalizeContentType(toNormalize) {
    if (!Array.isArray(toNormalize))
        return undefined;
    const filtered = toNormalize.filter(isNonEmptyString);
    return filtered.length > 0 ? filtered : undefined;
}
export function isCmsComponentWithDataQuery(toTest) {
    const toTestType = typeof (toTest);
    if ((toTestType == 'function' || toTestType == 'object') && toTest != null) {
        return toTest.getDataQuery && typeof (toTest.getDataQuery) == 'function' ? true : false;
    }
    return false;
}
export function isCmsComponentWithFragment(toTest) {
    const toTestType = typeof (toTest);
    if ((toTestType == 'function' || toTestType == 'object') && toTest != null)
        return toTest.getDataFragment && typeof (toTest.getDataFragment) == 'function' ? true : false;
    return false;
}
export function validatesFragment(toTest) {
    const toTestType = typeof (toTest);
    if ((toTestType == 'function' || toTestType == 'object') && toTest != null)
        return toTest.validateFragment && typeof (toTest.validateFragment) == 'function' ? true : false;
    return false;
}
export function contentLinkToRequestVariables(contentLink) {
    const variables = {
        key: contentLink.key ?? '-no-content-selected-',
        locale: contentLink.locale ? localeToGraphLocale(contentLink.locale) : undefined,
        version: contentLink.version
    };
    if (variables.version == undefined || variables.version == '')
        variables.version = null;
    return variables;
}
export function toUniqueValues(value, index, array) {
    return array.indexOf(value) == index;
}
export function trim(valueToTrim) {
    if (typeof (valueToTrim) == 'string')
        return valueToTrim.trim();
    return valueToTrim;
}
export function getContentEditId(contentLink) {
    return contentLink.key;
}
//# sourceMappingURL=utilities.js.map