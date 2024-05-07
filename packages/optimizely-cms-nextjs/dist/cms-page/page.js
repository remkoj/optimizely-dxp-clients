import { jsx as _jsx } from "react/jsx-runtime";
import 'server-only';
import deepmerge from 'deepmerge';
import { notFound } from 'next/navigation';
import { RouteResolver } from '@remkoj/optimizely-graph-client';
import { normalizeContentLinkWithLocale } from '@remkoj/optimizely-graph-client/utils';
import { CmsContent, isDebug, getServerContext } from '@remkoj/optimizely-cms-react/rsc';
import { Utils } from '@remkoj/optimizely-cms-react';
import { MetaDataResolver } from '../metadata';
import { urlToPath, localeToGraphLocale } from './utils';
import getContentByPathBase from './data';
import { getServerClient } from '../client';
export var SystemLocales;
(function (SystemLocales) {
    SystemLocales["All"] = "ALL";
    SystemLocales["Neutral"] = "NEUTRAL";
})(SystemLocales || (SystemLocales = {}));
const CreatePageOptionDefaults = {
    defaultLocale: null,
    getContentByPath: getContentByPathBase,
    client: getServerClient,
    propsToCmsPath: ({ params }) => buildRequestPath(params),
    propsToCmsLocale: ({ params }, defaultLocale) => params?.lang ?? defaultLocale ?? null,
    routeToParams: (route) => { return { path: urlToPath(route.url, route.locale), lang: route.locale }; }
};
/**
 * Generate the React Server Side component and Next.JS functions needed to render an
 * Optimizely CMS page. This component assumes that the routes are either defined as
 * /[lang]/[[...path]] or /[[...path]]
 *
 * @param       factory         The component factory to use for this page
 * @param       options         The page component generation options
 * @returns     The Optimizely CMS Page
 */
export function createPage(factory, options) {
    const { defaultLocale, getContentByPath, client: clientFactory, channel, propsToCmsLocale, propsToCmsPath, routeToParams } = {
        ...CreatePageOptionDefaults,
        ...options
    };
    const pageDefintion = {
        generateStaticParams: async () => {
            const client = clientFactory();
            const resolver = new RouteResolver(client);
            return (await resolver.getRoutes()).map(r => routeToParams(r));
        },
        generateMetadata: async (props, resolving) => {
            // Read variables from request            
            const client = clientFactory();
            const requestPath = propsToCmsPath(props);
            if (!requestPath)
                return Promise.resolve({});
            const routeResolver = new RouteResolver(client);
            const metaResolver = new MetaDataResolver(client);
            // Resolve the route to a content link
            const route = await routeResolver.getContentInfoByPath(requestPath);
            if (!route)
                return Promise.resolve({});
            // Set context
            getServerContext().setLocale(localeToGraphLocale(route.locale, channel));
            getServerContext().setOptimizelyGraphClient(client);
            // Prepare metadata fetching
            const contentLink = routeResolver.routeToContentLink(route);
            const contentType = route.contentType;
            const graphLocale = channel ? localeToGraphLocale(route.locale, channel) : null;
            // Fetch the metadata based upon the actual content type and resolve parent
            const [pageMetadata, baseMetadata] = await Promise.all([
                metaResolver.resolve(factory, contentLink, contentType, graphLocale),
                resolving
            ]);
            // Make sure merging of objects goes correctly
            for (const metaKey of Object.getOwnPropertyNames(pageMetadata)) {
                if (typeof (pageMetadata[metaKey]) == "object" && pageMetadata[metaKey] != null && baseMetadata[metaKey] != undefined && baseMetadata[metaKey] != null) {
                    //@ts-expect-error Silence error due to failed introspection...
                    pageMetadata[metaKey] = deepmerge(baseMetadata[metaKey], pageMetadata[metaKey], { arrayMerge: (target, source) => [...source] });
                }
            }
            // Not sure, but needed somehow...
            if (typeof (baseMetadata.metadataBase) == "string" && baseMetadata.metadataBase.length > 1) {
                pageMetadata.metadataBase = new URL(baseMetadata.metadataBase);
            }
            return pageMetadata;
        },
        CmsPage: async (props) => {
            // Prepare the context
            const context = getServerContext();
            const client = context.client ?? clientFactory();
            if (!context.client)
                context.setOptimizelyGraphClient(client);
            context.setComponentFactory(factory);
            // Analyze the Next.JS Request props
            const requestLocale = propsToCmsLocale(props, defaultLocale);
            const requestPath = propsToCmsPath(props);
            if (isDebug())
                console.log(`⚪ [CmsPage] Processed Next.JS route: ${JSON.stringify(props)} => Optimizely CMS route: ${JSON.stringify({ path: requestPath, locale: requestLocale })}`);
            // Process the locale
            const graphLocale = (requestLocale ? localeToGraphLocale(requestLocale, channel) : undefined);
            if (requestLocale)
                context.setLocale(requestLocale);
            // Resolve the content based upon the path
            if (!requestPath)
                return notFound();
            const response = await getContentByPath(client, { path: requestPath, locale: graphLocale });
            const info = (response?.content?.items ?? [])[0];
            if (!info) {
                if (isDebug()) {
                    console.error(`🔴 [CmsPage] Unable to load content for ${requestPath}, data received: `, response);
                }
                return notFound();
            }
            // Extract the type & link
            const contentType = Utils.normalizeContentType(info._metadata?.types);
            const contentLink = normalizeContentLinkWithLocale(info._metadata);
            if (contentLink?.locale)
                context.setLocale(contentLink?.locale);
            if (!contentLink) {
                console.error("🔴 [CmsPage] Unable to infer the contentLink from the retrieved content, this should not have happened!");
                return notFound();
            }
            // Render the content link
            return _jsx(CmsContent, { contentType: contentType, contentLink: contentLink, fragmentData: info });
        }
    };
    return pageDefintion;
}
/**
 *
 *
 * @param   param0  The URL parameters
 * @returns The request path as understood by Graph
 */
function buildRequestPath({ lang, path }) {
    const slugs = [];
    if (path)
        slugs.push(...path.filter(x => x));
    if (lang)
        slugs.unshift(lang);
    if (slugs.length == 0)
        return '/';
    const fullPath = '/' + slugs.filter(x => x && x.length > 0).join('/');
    if (!slugs[slugs.length - 1].includes('.'))
        return fullPath + '/';
    return fullPath;
}
//# sourceMappingURL=page.js.map