import { readValue, readValueAsBoolean, readValueAsInt } from "./utils/env"
import EnvVars from "./env-vars"

export function readConfigFromEnv()
{
    return {
        RuntimeEnv: readValue('NODE_ENV', 'production'),
        OdpApiKey: readValue(EnvVars.OdpApiKey),
        OdpService: readValue(EnvVars.OdpService, "https://api.zaius.com/"),
        OdpAudienceBatchSize: readValueAsInt(EnvVars.OdpAudienceBatchSize, 25),
        HelperEnabled: readValueAsBoolean(EnvVars.HelperEnabled, false),
        ContentRecsClient: readValue(EnvVars.ContentRecsClient),
        ContentRecsDelivery: readValueAsInt(EnvVars.ContentRecsDelivery, 0),
        ContentRecsDeliveryKey: readValue(EnvVars.ContentRecsDeliveryKey),
        ContentRecsHost: readValue(EnvVars.ContentRecsHost, "idio.co"),
        FrontendCookie: readValue(EnvVars.FrontendCookie, "visitorId"),
        WebExperimentationProject: readValue(EnvVars.WebExperimentationProject),
        OptimizelyDebug: readValueAsBoolean(EnvVars.OptimizelyDebug, false)
    }
}

export function checkProductStatus(config?: Partial<OptiOneConfig>) : {
    dataPlatform: boolean,
    contentRecsClient: boolean,
    contentRecsApi: boolean,
    webExperimentation: boolean
}
{
    const appConfig : Partial<OptiOneConfig> = config ?? readConfigFromEnv()
    return {
        dataPlatform: typeof(appConfig.OdpApiKey) == 'string' && appConfig.OdpApiKey.length > 8,
        contentRecsClient: appConfig.ContentRecsClient && appConfig.ContentRecsDelivery ? true : false,
        contentRecsApi: appConfig.ContentRecsClient && appConfig.ContentRecsDeliveryKey ? true: false,
        webExperimentation: typeof(appConfig.WebExperimentationProject) == 'string' && appConfig.WebExperimentationProject.length > 5
    }
}

export type OptiOneConfig = ReturnType<typeof readConfigFromEnv>

export default readConfigFromEnv