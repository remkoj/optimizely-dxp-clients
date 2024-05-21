import 'server-only';
import React from 'react';
import createBaseClient from '@remkoj/optimizely-graph-client';
export const getServerClient = React.cache(() => {
    const client = createBaseClient();
    if (client.debug)
        console.log('⚪ [ContentGraph Shared Client] Created new Optimizely Graph client');
    return client;
});
export const getAuthorizedServerClient = (token) => {
    const client = createBaseClient();
    if (client.debug)
        console.log('⚪ [ContentGraph Shared Client] Created new Optimizely Graph client with authentication details');
    client.updateAuthentication(token);
    if (client.debug)
        console.log(`🟡 [ContentGraph Shared Client] Updated authentication, current mode: ${client.currentAuthMode}`);
    return client;
};
export const createClient = getServerClient;
export const createAuthorizedClient = getAuthorizedServerClient;
export default getServerClient();
//# sourceMappingURL=client.js.map