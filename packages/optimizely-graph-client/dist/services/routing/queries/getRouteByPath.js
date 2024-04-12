import { gql } from "graphql-request";
export const query = gql `query GetRouteByPath($path: String!, $domain: String) {
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
}`;
//# sourceMappingURL=getRouteByPath.js.map