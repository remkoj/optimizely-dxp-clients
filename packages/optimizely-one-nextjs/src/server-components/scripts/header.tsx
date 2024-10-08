import 'server-only'
import EnvTools from '../../utils/env'
import EnvVars from '../../env-vars'
import OdpScript from '../../products/data-platform/snippet'
import ExpScript from '../../products/web-experimentation/snippet'

export type HeaderScriptsProps = {
    /**
     * The public or private key for the Optimizely Data Platform that will be
     * used to add the ODP tracking script.
     * 
     * If not provided, it will be read from the "OPTIMIZELY_DATAPLATFORM_ID"
     * environment variable.
     */
    dataPlatformTrackerId?: string

    /**
     * The Optimizely Web Experimentation Project ID that will be used within the
     * frontend.
     * 
     * If not provided, it will be read from the "OPTIMIZELY_WEB_EXPERIMENTATION_PROJECT"
     * environment variable.
     */
    experimentationProjectId?: string

    /**
     * Allow (persisted using localStorage) overriding of the Web Experimentation
     * ProjectID. This is usefull if you need to use one demo site with multiple
     * projects.
     * 
     * If not provided (i.e. undefined), it will allow overriding based upon the
     * "OPTIMIZELY_ONE_HELPER" environment variable.
     */
    experimentationAllowOverride?: boolean

    /**
     * When set, the Web Experimentation script will be proxied through a Next.JS
     * api, so there's no call to the optimizely.com domain within the page. The
     * snippet will be cached for 15 minutes, so this will add an additional delay
     * to publishing new experiments.
     */
    useScriptProxy?: boolean

    /**
     * The path where the proxy, included within this package has been installed,
     * it defaults to /api/me, which is the path used when following the 
     * instructions of the README.
     */
    apiPrefix?: string
}

/**
 * Add the Scripts that must be included within the frontend to use the Optimizely
 * One services.
 * 
 * @param   param0  The parameters for this component
 * @returns The fragment with all Header Scripts
 */
export default function ({
    dataPlatformTrackerId,
    experimentationProjectId,
    experimentationAllowOverride,
    useScriptProxy = false,
    apiPrefix = '/api/me'
}: HeaderScriptsProps)
{
    const odp_id = dataPlatformTrackerId || EnvTools.readValue(EnvVars.OdpApiKey)
    const exp_id = experimentationProjectId || EnvTools.readValue(EnvVars.WebExperimentationProject)
    const useOptiOneHelper = experimentationAllowOverride == undefined ? EnvTools.readValueAsBoolean(EnvVars.HelperEnabled, false) : experimentationAllowOverride
    return <>
        { odp_id && <OdpScript trackerId={ odp_id } /> }
        { exp_id && <ExpScript projectId={ exp_id } allowProjectOverride={ useOptiOneHelper } useProxy={ useScriptProxy } apiPrefix={ apiPrefix }/> }
    </>
}