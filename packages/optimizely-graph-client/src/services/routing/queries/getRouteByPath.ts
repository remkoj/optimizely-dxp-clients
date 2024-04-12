import { gql } from "graphql-request"
import { type Route } from "./getAllRoutes.js"

export type Variables = {
    path: string
    domain?: string | null
}

export type Result = {
    Content: {
        total: number
        items: Route[]
    }
}

export const query = gql`query GetRouteByPath($path: String!, $domain: String) {
    Content(
        where: {  
            _metadata: {
                url: {
                    hierarchical: { eq: $path }
                    base: { eq: $domain }
                }
            }
        }
    ) {
        total
        items {
            _metadata {
                key
                version
                locale
                displayName
                types
                url {
                    path: hierarchical
                    domain: base
                }
            }
            changed: _modified
        }
    }
}`