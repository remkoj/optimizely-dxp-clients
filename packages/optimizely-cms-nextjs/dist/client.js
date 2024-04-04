import 'server-only';
import React from 'react';
import createBaseClient from '@remkoj/optimizely-graph-client';
import { isDebug } from '@remkoj/optimizely-cms-react/rsc';
export const getServerClient = React.cache(() => {
    if (isDebug())
        console.log('⚪ [ContentGraph Shared Client] Creating new Optimizely Graph client');
    return createBaseClient();
});
export const getAuthorizedServerClient = (token) => {
    if (isDebug())
        console.log('⚪ [ContentGraph Shared Client] Creating new Optimizely Graph client with authentication details');
    const client = createBaseClient();
    client.updateAuthentication(token);
    if (isDebug())
        console.log(`🟡 [ContentGraph Shared Client] Updated authentication, current mode: ${client.currentAuthMode}`);
    return client;
};
export const createClient = getServerClient;
export const createAuthorizedClient = getAuthorizedServerClient;
export default getServerClient();
//# sourceMappingURL=client.js.map