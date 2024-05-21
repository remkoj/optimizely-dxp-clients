import 'server-only'
import React from 'react'
import createBaseClient, { type IOptiGraphClient } from '@remkoj/optimizely-graph-client'

export const getServerClient : () => IOptiGraphClient = React.cache(() => {
    const client = createBaseClient()
    if (client.debug)
        console.log('⚪ [ContentGraph Shared Client] Created new Optimizely Graph client')
    return client
})

export const getAuthorizedServerClient : (token?:string) => IOptiGraphClient = (token) => {
    const client = createBaseClient()
    if (client.debug)
        console.log('⚪ [ContentGraph Shared Client] Created new Optimizely Graph client with authentication details')
    client.updateAuthentication(token)
    if (client.debug)
        console.log(`🟡 [ContentGraph Shared Client] Updated authentication, current mode: ${ client.currentAuthMode }`)
    return client
}

export const createClient = getServerClient
export const createAuthorizedClient = getAuthorizedServerClient
export default getServerClient()