import { gql } from 'graphql-request';
export const getContentById = async (client, variables) => {
    return await client.request(gqlQuery, variables);
};
const gqlQuery = gql `query getContentByIdBase($key: String!, $version: String, $locale: [Locales!], $path: String, $domain: String) {
    content: Content(
        where: {
            _or: [
                { _metadata: { key: { eq: $key }, version: { eq: $version } } }
                { _metadata: { url: { hierarchical: { eq: $path }, base: { eq: $domain } }, version: { eq: $version } } }
            ]
        }
        locale: $locale
    ) {
        total
        items {
            _metadata {
                key
                locale
                types
                displayName
                version
            }
            _type: __typename
        }
    }
}`;
//# sourceMappingURL=data.js.map