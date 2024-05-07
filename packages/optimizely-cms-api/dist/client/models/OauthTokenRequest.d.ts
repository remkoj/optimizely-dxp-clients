/**
 * Represents an OAuth token request.
 */
export type OauthTokenRequest = {
    /**
     * Gets or sets the grant type.
     */
    grant_type?: string | null;
    /**
     * Gets or sets the client id.
     */
    client_id?: string | null;
    /**
     * Gets or sets the client secret.
     */
    client_secret?: string | null;
    /**
     * Get or sets the subject to act as.
     */
    act_as?: string | null;
};
