import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/* eslint @next/next/no-before-interactive-script-outside-document: 0 */
import Script from 'next/script';
export const OptimizelyWebExperimentationScript = ({ projectId, apiPrefix = "/api/me", useApiProxy = false }) => {
    const scriptSrc = useApiProxy ? `${apiPrefix}/exp` : `https://cdn.optimizely.com/js/${projectId}.js`;
    return _jsxs(_Fragment, { children: [_jsx(Script, { id: 'web-experimentation-startup', strategy: 'beforeInteractive', children: `window["optimizely"] = window["optimizely"] || [];` }), _jsx(Script, { id: 'web-experimentation-project', strategy: 'beforeInteractive', src: scriptSrc })] });
};
export default OptimizelyWebExperimentationScript;
//# sourceMappingURL=optimizely-web-experimentation.js.map