import { gql } from "graphql-request";
export const query = gql `query GetRouteById($key: String!, $version: String, $locale: [Locales]) {
    Content(
        where: { _metadata: { key: { eq: $key }, version: { eq: $workId } } }
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
            }
            changed: _modified
        }
    }
}`;
//# sourceMappingURL=getRouteById.js.map