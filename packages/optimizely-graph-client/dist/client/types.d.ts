import type { GraphQLClient } from "graphql-request";
export type RequestMethod = InstanceType<typeof GraphQLClient>['request'];
export type ClientInstanceType = InstanceType<typeof GraphQLClient>;
export type QueryParams = {
    query: Parameters<RequestMethod>[0]['document'];
    variables: Parameters<RequestMethod>[0]['variables'];
};
export declare enum AuthMode {
    Public = "epi-single",
    Basic = "use-basic",
    HMAC = "use-hmac",
    Token = "use-token"
}
export type OptiGraphSiteInfo = {
    frontendDomain?: string;
    cmsURL?: string;
    publishToken?: string;
};
export type IOptiGraphClientFlags = {
    queryCache: boolean;
    recursive: boolean;
    cache: boolean;
};
export interface IOptiGraphClient extends ClientInstanceType {
    /**
     * Retrieve the debug indicator, as configured for this client
     */
    readonly debug: boolean;
    /**
     * Retrieve basic information about the configured frontend
     */
    readonly siteInfo: OptiGraphSiteInfo;
    /**
     * Retrieve the current authentication mode
     */
    readonly currentAuthMode: AuthMode;
    /**
     * Update the authentication data for this client.
     * - Set to AuthMode.HMAC or AuthMode.Basic to use that authentication scheme, this requires the AppKey and Secret to be part of the configuration
     * - Set to the actual token to be used to switch to AuthMode.Token
     * - Set to undefined or AuthMode.Public to switch to public, read-only mode. (i.e. using the SingleKey)
     *
     * @param       tokenOrAuthmode     The authentication mode/token to be used
     * @returns     The client itself
     */
    updateAuthentication(tokenOrAuthmode?: string | AuthMode | undefined): IOptiGraphClient;
    /**
     * Convenience method, for those who are more used to the API of ApolloClient
     *
     * @deprecated  Use the "request" method instead
     */
    query: RequestMethod;
    /**
     * Set the client controllable service configuration
     *
     * @param   newFlags      The configuration values to override
     * @param   temporary     Set to true to store the old configuration, please note that you cannot invoke this method again untill the configuration has been restored first
     * @returns Itself, so you chain it in a request
     */
    updateFlags(newFlags: Partial<IOptiGraphClientFlags>, temporary?: boolean): IOptiGraphClient;
    /**
     * Restore client controllable service configuration, after it has been saved by a temporary update. If there's nothing to restore this method will do nothing
     *
     * @returns Itself, so you chain it in a request
     */
    restoreFlags(): IOptiGraphClient;
}
export type ClientFactory = (token?: string) => IOptiGraphClient;
