import { useCallback } from "react";
export const useQueryParam = (paramName, defaultValue) => {
    const value = getQueryParam(paramName, defaultValue);
    const remove = useCallback(() => {
        return removeQueryParam(paramName);
    }, [paramName]);
    const set = useCallback((newValue) => {
        return setQueryParam(paramName, newValue);
    }, [paramName]);
};
function setQueryParam(key, newValue) {
}
function removeQueryParam(key) {
}
function getQueryParam(key, defaultValue) {
    return getQueryParams().get(key) ?? defaultValue;
}
function getQueryParams() {
    try {
        const { search } = window.location;
        return new URLSearchParams(search);
    }
    catch {
        return new URLSearchParams();
    }
}
export default useQueryParam;
//# sourceMappingURL=useQueryParam.js.map