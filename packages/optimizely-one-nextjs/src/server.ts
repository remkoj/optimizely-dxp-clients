import 'server-only'
import EnvVars from './env-vars'
import EnvTools from './utils/env'
import { checkProductStatus, readConfigFromEnv, type OptiOneConfig } from './config'

export * from './products'
export * as Session from './utils/session'
export * as EnvTools from './utils/env'

export function isOptimizelyOneEnabled() : boolean
{
    return EnvTools.readValueAsBoolean(EnvVars.HelperEnabled, false)
}

export * from './server-components'
export * from './components/rsc'

export type SupportedProductNames = keyof ReturnType<typeof checkProductStatus>

export function getEnabledProducts(config?: Partial<OptiOneConfig>) : Array<SupportedProductNames> {
    const optiOneConfig = config ?? readConfigFromEnv()
    const status = checkProductStatus(optiOneConfig)
    const enabledProducts = (Object.getOwnPropertyNames(status) as Array<keyof typeof status>).reduce((list, currentProductName) => { 
        if (status[currentProductName])
            list.push(currentProductName);
        return list 
    }, [] as Array<keyof typeof status>)
    return enabledProducts
}