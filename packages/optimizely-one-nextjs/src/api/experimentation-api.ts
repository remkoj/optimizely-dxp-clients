import type { ApiService } from './types'
import * as EnvTools from '../utils/env'
import EnvVars from '../env-vars'

export const ExperimentationApiService : ApiService<any> = {
    for: { path: '/exp', verb: 'get' },
    handler: async (query) => {
        const configuredProjectId = EnvTools.readValue(EnvVars.WebExperimentationProject)
        const queryProjectId = query.get('pid') ?? undefined
        const helperEnabled = EnvTools.readValueAsBoolean(EnvVars.HelperEnabled, false)
        const projectId = helperEnabled ? queryProjectId ?? configuredProjectId : configuredProjectId

        // Make sure we have a Project ID
        if (!projectId) {
            if (EnvTools.readValueAsBoolean(EnvVars.OptimizelyDebug, false))
                console.log("🔴 No Optimizely Web Experimentation Project ID identified")
            return [{ error: { message: "Project not found", status: 404 }}, 404]
        }

        
        const snippetResponse = await fetch(`https://cdn.optimizely.com/js/${ projectId }.js`, {
            //@ts-expect-error: Next.JS extended fetch
            next: {
                revalidate: 900 // Cache the script for 15 minutes
            }
        })
        if (!snippetResponse.ok) {
            if (EnvTools.readValueAsBoolean(EnvVars.OptimizelyDebug, false))
                console.log("🔴 Non OK response from the Optimizely Web Experimentation CDN")
            return [{error: { message: snippetResponse.statusText, status: snippetResponse.status}}, snippetResponse.status ]
        }

        const body = await snippetResponse.text()

        return [body, snippetResponse.status, "text/javascript; charset=utf-8"]
    },
}

export default ExperimentationApiService