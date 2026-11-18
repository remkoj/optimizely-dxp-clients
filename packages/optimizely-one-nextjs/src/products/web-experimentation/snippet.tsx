import Script from 'next/script'
import { InlineScript } from '../../components/inline-script.js'

/**
 * Configuration for the Web Experimentation tracking snippets.
 */
export type OptimizelyWebExperimentationProps = {
  /** Web Experimentation project ID. */
  projectId: string | number
  /** Enables choosing a project with the `pid` query parameter. */
  allowProjectOverride?: boolean
  /** Loads the Web Experimentation project script through the local API proxy. */
  useProxy?: boolean
  /** API route prefix used when `useProxy` is enabled. */
  apiPrefix?: string
}

/**
 * Renders the Web Experimentation startup and project scripts.
 *
 * @param props Web Experimentation project and script options.
 * @returns The Web Experimentation script elements and resource hints.
 */
export const OptimizelyWebExperimentationScript = ({ projectId, allowProjectOverride = false, useProxy = false, apiPrefix = '/api/me' }: OptimizelyWebExperimentationProps) => 
{
  function buildUrl(pid: string|number)
  {
    return useProxy ?
      `${ apiPrefix }/exp${ allowProjectOverride ? '?pid=' + pid : '' }` :
      `https://cdn.optimizely.com/js/${ pid }.js`
  }

  return <>
    <InlineScript id='web-experimentation-startup' html={`window["optimizely"] = window["optimizely"] || [];`} />
    { allowProjectOverride ? 
      <InlineScript id='web-experimentation-project' html={`
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
            `} /> :
      <Script id='web-experimentation-project' strategy='beforeInteractive' src={ buildUrl(projectId) } />
    }
  </>
}

export default OptimizelyWebExperimentationScript
