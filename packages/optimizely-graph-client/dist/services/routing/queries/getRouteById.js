import { gql } from "graphql-request";
export const query = gql `query GetRouteById($key: String!, $version: String, $locale: [Locales]) {
    _Content(
        where: { _metadata: { key: { eq: $key }, version: { eq: $version } } }
        locale: $locale
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
                ... on IInstanceMetadata {
                  	slug: routeSegment
                }
                ... on IMediaMetadata {
                  	slug: routeSegment
                }
            }
            changed: _modified
        }
    }
}`;
//# sourceMappingURL=getRouteById.js.map