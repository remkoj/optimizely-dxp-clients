import 'server-only'
import createBaseClient, { type IOptiGraphClient, AuthMode } from '@remkoj/optimizely-graph-client'

export const getServerClient : () => IOptiGraphClient = () => {
    const client = createBaseClient()
    if (client.debug)
        console.log('⚪ [ContentGraph Shared Client] Created new Optimizely Graph client')
    return client
}

export const getAuthorizedServerClient : (token?:string) => IOptiGraphClient = (token) => {
    const client = createBaseClient()
    if (client.debug)
        console.log('⚪ [ContentGraph Shared Client] Created new Optimizely Graph client with authentication details')
    if (typeof(token) == 'string' && token.length > 0) {
        if (token == client.siteInfo.publishToken) {
            console.warn(`🔐 [ContentGraph Shared Client] Allowed authenticated access by publish token`)
            client.updateAuthentication(AuthMode.HMAC)
        } else
            client.updateAuthentication(token)
    }
    if (client.debug)
        console.log(`🟡 [ContentGraph Shared Client] Updated authentication, current mode: ${ client.currentAuthMode }`)
    return client
}

export const createClient = getServerClient
export const createAuthorizedClient = getAuthorizedServerClient
export default getServerClient()