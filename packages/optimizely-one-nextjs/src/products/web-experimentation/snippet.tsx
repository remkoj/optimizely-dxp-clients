/* eslint @next/next/no-before-interactive-script-outside-document: 0 */
import Script from 'next/script'

export type OptimizelyWebExperimentationProps = {
    projectId: string | number
    allowProjectOverride?: boolean
    useProxy?: boolean
    apiPrefix?: string
}

export const OptimizelyWebExperimentationScript = ({ projectId, allowProjectOverride = false, useProxy = false, apiPrefix = '/api/me' }: OptimizelyWebExperimentationProps) => 
{
    function buildUrl(pid: string|number)
    {
        return useProxy ?
            `${ apiPrefix }/exp?pid=${ pid }` :
            `https://cdn.optimizely.com/js/${ pid }.js`
    }

    return <>
        <Script id='web-experimentation-startup' strategy='beforeInteractive'>{ `window["optimizely"] = window["optimizely"] || [];`}</Script>
        { allowProjectOverride ? 
            <Script id='web-experimentation-project' strategy='beforeInteractive'>{`
((w,d,l) => {
    const localProject = l.getItem('_pid');
    const queryProject = (new URLSearchParams(w.location.search)).get('pid');
    const currentProject = queryProject || localProject || '${ projectId }';
    if (currentProject != localProject)
        l.setItem('_pid', currentProject)

    let wx = d.createElement('script');
    wx.fetchpriority = 'high';
    wx.src='${ buildUrl('\'+ currentProject +\'') }';
    wx.id='web-experimentation-snippet';
    let s=d.getElementById('web-experimentation-project');
    s.parentNode.insertBefore(wx,s);
})(window,document,localStorage)
            `}</Script> :
            <Script id='web-experimentation-project' strategy='beforeInteractive' src={ buildUrl(projectId) } />
        }
    </>
}

export default OptimizelyWebExperimentationScript