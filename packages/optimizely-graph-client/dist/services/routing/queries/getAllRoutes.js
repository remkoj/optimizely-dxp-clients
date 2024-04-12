import { gql } from "graphql-request";
export const query = gql `query GetAllRoutes($cursor: String, $pageSize: Int = 100, $typeFilter: [String] = "Page", $domain: String) {
    Content(
        where: {
            _metadata: {
                url: { hierarchical: { exist: true }, base: { eq: $domain } }
                types: { in: $typeFilter }
            }
        }
        limit: $pageSize
        cursor: $cursor
    ) {
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
        cursor
        total
    }
}`;
//# sourceMappingURL=getAllRoutes.js.map