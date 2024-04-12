import { gql } from "graphql-request";
export const getMetaDataByPath = (client, variables) => {
    return client.request(metadataQuery, variables);
};
export const getContentByPath = (client, variables) => {
    return client.request(contentQuery, variables);
};
export default getContentByPath;
const contentQuery = gql `query getContentByPathBase($path: String!, $domain: String, $locale: [Locales]) {
    content: Content(
        where: { _metadata: { url: { hierarchical: { eq: $path }, base: { eq: $domain } } } }
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
const metadataQuery = gql `query getGenericMetaData($path: String!, $locale: [Locales], $siteId: String) {
    getGenericMetaData: Content (
        where: { RelativePath: { eq: $path }, SiteId: { eq: $siteId } }
        locale: $locale
    ) {
        items {
            name: Name,
            alternatives: ExistingLanguages {
                locale: Name
                href: Link
            }
            canonical: Url
        }
    }
}`;
//# sourceMappingURL=data.js.map