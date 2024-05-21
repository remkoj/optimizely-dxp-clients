/* eslint @next/next/no-before-interactive-script-outside-document: 0 */
import Script from 'next/script'

export type OptimizelyWebExperimentationProps = {
    projectId: string | number
    useApiProxy?: boolean
    apiPrefix?: string
}

export const OptimizelyWebExperimentationScript = ({ projectId, apiPrefix = "/api/me", useApiProxy = false }: OptimizelyWebExperimentationProps) => 
{
    const scriptSrc = useApiProxy ? `${ apiPrefix }/exp` : `https://cdn.optimizely.com/js/${ projectId }.js`
    return <>
        <Script id='web-experimentation-startup' strategy='beforeInteractive'>{ `window["optimizely"] = window["optimizely"] || [];`}</Script>
        <Script id='web-experimentation-project' strategy='beforeInteractive' src={ scriptSrc } />
    </>
}

export default OptimizelyWebExperimentationScript