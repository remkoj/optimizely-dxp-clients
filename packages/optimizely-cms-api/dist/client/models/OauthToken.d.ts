/**
 * Represents an OAuth JSON Web Token (JWT) and
 * its expiry in seconds.
 */
export type OauthToken = {
    /**
     * Gets or sets the access token.
     */
    access_token?: string | null;
    /**
     * Gets or sets the expiry time in seconds.
     */
    expires_in?: number;
    /**
     * Gets or sets the token type.
     */
    token_type?: string;
};
