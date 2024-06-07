import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import 'server-only';
import { AuthMode } from '@remkoj/optimizely-graph-client';
import { contentLinkToString } from '@remkoj/optimizely-graph-client/utils';
import { Utils } from '@remkoj/optimizely-cms-react';
import { CmsContent, getServerContext } from '@remkoj/optimizely-cms-react/rsc';
import { notFound } from 'next/navigation.js';
import OnPageEdit from '../components/on-page-edit.js';
import { getAuthorizedServerClient } from '../client.js';
import React from 'react';
import Script from 'next/script.js';
import { getContentById } from './data.js';
function readValue(variableName, defaultValue) {
    try {
        const stringValue = process?.env ? process.env[variableName] : undefined;
        return stringValue || defaultValue;
    }
    catch {
        return defaultValue;
    }
}
function readValueAsInt(variableName, defaultValue) {
    const stringValue = readValue(variableName);
    if (!stringValue)
        return defaultValue;
    try {
        return parseInt(stringValue);
    }
    catch {
        return defaultValue;
    }
}
const defaultOptions = {
    refreshNotice: () => _jsx("div", { className: 'optly-refresh-notice', children: "Updating preview, please wait...." }),
    errorNotice: props => _jsxs("div", { className: 'optly-error-notice', children: [_jsx("div", { className: 'optly-error-title', children: props.title }), _jsx("div", { className: 'optly-error-message', children: props.message })] }),
    layout: props => _jsx(_Fragment, { children: props.children }),
    loader: getContentById,
    clientFactory: (token) => getAuthorizedServerClient(token),
    communicationInjectorPath: '/util/javascript/communicationinjector.js'
};
// Helper function to read the ContentID & WorkID
function getContentRequest(path = "", searchParams) {
    try {
        if (searchParams.preview_token == AuthMode.HMAC || searchParams.preview_token == AuthMode.Basic) {
            console.error("🦺 [OnPageEdit] Edit mode requested with developer tokens, falling back to URL parsing to determine content");
            const fullPath = Array.isArray(path) ? path.map(p => decodeURIComponent(p)).join('/') : decodeURI(path);
            const [cmsPath, contentString] = fullPath.split(',,', 3);
            const [contentKey, contentVersion] = (contentString ?? '').split('_', 3);
            const contentPath = (cmsPath.startsWith('/') ? cmsPath.substring(1) : cmsPath).replace(/^(ui\/){0,1}(CMS\/){0,1}(Content\/){0,1}/gi, "");
            const firstSlug = contentPath.split('/')[0];
            const contentLocale = firstSlug?.length == 2 || firstSlug?.length == 5 ? firstSlug : undefined;
            return {
                key: contentKey,
                version: contentVersion,
                locale: contentLocale,
                path: '/' + contentPath + (contentPath.endsWith('/') || contentPath == '' ? '' : '/')
            };
        }
        else {
            const tokenInfo = JSON.parse(atob(searchParams.preview_token.split('.')[1]));
            return {
                key: tokenInfo.key,
                version: tokenInfo.ver,
                locale: tokenInfo.loc,
                path: ''
            };
        }
    }
    catch {
        return undefined;
    }
}
/**
 * Create the EditPage component needed by Next.JS to render the "On Page
 * Editing" variant of the content item selected by the editor.
 *
 * @param   dxpUrl      The domain of the CMS instance
 * @param   client      The Apollo GraphQL client to use
 * @param   factory     The component factory to be used
 * @param   options     The optional options to use to control the edit page
 * @returns The React Component that can be used by Next.JS to render the page
 */
export function createEditPageComponent(factory, options) {
    const { layout: PageLayout, refreshNotice: RefreshNotice, errorNotice: ErrorNotice, loader: getContentById, clientFactory, communicationInjectorPath } = { ...defaultOptions, ...options };
    async function EditPage({ params: { path }, searchParams }) {
        // Create context
        const context = getServerContext();
        // Validate the search parameters
        const epiEditMode = searchParams?.epieditmode?.toLowerCase();
        if (epiEditMode != 'true' && epiEditMode != 'false') {
            console.error("🔴 [OnPageEdit] Edit mode requested without valid EpiEditMode, refused to render the page. Mode set:", searchParams.epieditmode);
            return notFound();
        }
        // Allow use-hmac as magic token to be used only on a development environment, otherwise require a minimal length string as token
        const token = searchParams.preview_token;
        const validDev = context.isDevelopment && (searchParams.preview_token == AuthMode.HMAC || searchParams.preview_token == AuthMode.Basic);
        if (!token || (token.length < 20 && !validDev)) {
            console.error("🔴 [OnPageEdit] Edit mode requested without valid Preview Token, refused to render the page");
            return notFound();
        }
        if (context.isDebug)
            console.log(`⚪ [OnPageEdit] Valid edit mode request: EpiEditMode=${searchParams.epieditmode}`);
        // Build context
        const client = clientFactory(token);
        context.setOptimizelyGraphClient(client);
        context.setComponentFactory(factory);
        context.setInEditMode(true);
        // Get information from the Request URI
        const contentRequest = getContentRequest(path, searchParams);
        if (!contentRequest) {
            console.error("🔴 [OnPageEdit] Unable to resolve requested content");
            return notFound();
        }
        if (context.isDebug) {
            console.log("⚪ [OnPageEdit] Requested content:", JSON.stringify(contentRequest));
            console.log("⚪ [OnPageEdit] Creating GraphQL Client:", token);
        }
        try {
            const contentInfo = await getContentById(client, contentRequest);
            if ((contentInfo?.content?.total ?? 0) > 1) {
                console.warn("🟠 [OnPageEdit] Content request " + JSON.stringify(contentRequest) + " yielded more then one item, picking first matching");
            }
            const contentItem = (contentInfo?.content?.items ?? [])[0];
            const contentType = Utils.normalizeContentType(contentItem?._metadata.types);
            // Return a 404 if the content item or type could not be resolved
            if (!contentItem) {
                console.warn(`🟠 [OnPageEdit] The content item for ${JSON.stringify(contentRequest)} could not be loaded from Optimizely Graph`);
                return notFound();
            }
            if (!contentType) {
                console.warn(`🟠 [OnPageEdit] The content item for ${JSON.stringify(contentRequest)} did not contain content type information`);
                return notFound();
            }
            const contentLink = {
                key: contentItem._metadata.key,
                locale: contentItem._metadata.locale,
                version: contentItem._metadata.version
            };
            if (context.isDebug) {
                console.log("⚪ [OnPageEdit] Resolved content:", JSON.stringify({
                    ...contentLink,
                    type: (contentItem.contentType ?? []).join('/')
                }));
            }
            // Store the editable content so it can be tested
            context.setEditableContentId(contentLink);
            if (contentLink.locale)
                context.setLocale(contentLink.locale);
            // Render the content, with edit mode context
            const isPage = contentType.some(x => x?.toLowerCase() == "page") ?? false;
            const Layout = isPage ? PageLayout : React.Fragment;
            const output = _jsxs(_Fragment, { children: [_jsx(Script, { src: new URL(communicationInjectorPath, client.siteInfo.cmsURL).href, strategy: 'afterInteractive' }), _jsxs(Layout, { locale: contentItem.locale?.name ?? '', children: [_jsx(OnPageEdit, { mode: context.inEditMode ? 'edit' : 'preview', children: _jsx(RefreshNotice, {}) }), _jsx(CmsContent, { contentType: contentType, contentLink: contentLink, fragmentData: contentItem })] }), _jsxs("div", { className: 'optly-contentLink', children: ["ContentItem: ", contentLink ? contentLinkToString(contentLink) : "Invalid content link returned from Optimizely Graph"] })] });
            return output;
        }
        catch (e) {
            console.error("🔴 [OnPageEdit] Caught error", e);
            return notFound();
        }
    }
    return EditPage;
}
export default createEditPageComponent;
//# sourceMappingURL=page.js.map