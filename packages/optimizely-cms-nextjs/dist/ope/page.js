import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import 'server-only';
import { AuthMode } from '@remkoj/optimizely-graph-client';
import { Utils } from '@remkoj/optimizely-cms-react';
import { CmsContent, getServerContext } from '@remkoj/optimizely-cms-react/rsc';
import { notFound } from 'next/navigation';
import OnPageEdit from '../components/on-page-edit';
import { getAuthorizedServerClient } from '../client';
import React from 'react';
import Script from 'next/script';
import { getContentById } from './data';
const defaultOptions = {
    refreshDelay: 2000,
    refreshNotice: () => _jsx("div", { className: 'optly-refresh-notice', children: "Updating preview, please wait...." }),
    errorNotice: props => _jsxs("div", { className: 'optly-error-notice', children: [_jsx("div", { className: 'optly-error-title', children: props.title }), _jsx("div", { className: 'optly-error-message', children: props.message })] }),
    layout: props => _jsx("div", { className: 'optly-edit-page', "data-locale": props.locale, children: props.children }),
    loader: getContentById,
    clientFactory: (token) => getAuthorizedServerClient(token),
    communicationInjectorPath: '/ui/CMS/latest/clientresources/communicationinjector.js'
};
/**
 * Create the EditPage component needed by Next.JS to render the "On Page
 * Editing" variant of the content item selected by the editor.
 *
 * @param   dxpUrl      The domain of the CMS instance
 * @param   client      The Apollo GraphQL client to use
 * @param   channel     The static site definition to use
 * @param   factory     The component factory to be used
 * @param   options     The optional options to use to control the edit page
 * @returns The React Component that can be used by Next.JS to render the page
 */
export function createEditPageComponent(channel, factory, options) {
    const { layout: PageLayout, refreshNotice: RefreshNotice, refreshDelay, errorNotice: ErrorNotice, loader: getContentById, clientFactory, communicationInjectorPath } = { ...defaultOptions, ...options };
    async function EditPage({ params, searchParams }) {
        // Create context
        const context = getServerContext();
        // Validate the search parameters
        const epiEditMode = searchParams?.epieditmode?.toLowerCase();
        if (epiEditMode != 'true' && epiEditMode != 'false') {
            console.error("[OnPageEdit] Edit mode requested without valid EpiEditMode, refused to render the page. Mode set:", searchParams.epieditmode);
            return notFound();
        }
        // Allow use-hmac as magic token to be used only on a development environment, otherwise require a minimal length string as token
        const token = searchParams.preview_token;
        const validDev = context.isDevelopment && (searchParams.preview_token == AuthMode.HMAC || searchParams.preview_token == AuthMode.Basic);
        if (!token || (token.length < 20 && !validDev)) {
            console.error("[OnPageEdit] Edit mode requested without valid Preview Token, refused to render the page");
            return notFound();
        }
        if (context.isDebug)
            console.log(`[OnPageEdit] Valid edit mode request: EpiEditMode=${searchParams.epieditmode}`);
        // Helper function to read the ContentID & WorkID
        function getContentIds() {
            try {
                // When using HMAC authentication, fall back to information in the URL
                if (validDev) {
                    const contentString = slugs.join('/').split(',,').pop() ?? '';
                    const [contentId, workId] = contentString.split('_', 3);
                    return [Number.parseInt(contentId), workId ? Number.parseInt(workId) : null];
                }
                // Normally take the information from the token
                const jwt = JSON.parse(Buffer.from((token || '..').split('.', 3)[1], 'base64').toString());
                const contentId = Number.parseInt(jwt?.c_id || '-1', 10);
                const workId = Number.parseInt(jwt?.c_ver || '0') || null;
                if ((jwt.exp * 1000) < Date.now())
                    console.warn("[OnPageEdit] Token has expired, it is unlikely that you are able to fetch content with it");
                return [contentId, workId];
            }
            catch {
                return [-1, null];
            }
        }
        // Build context
        const client = clientFactory(token);
        context.setOptimizelyGraphClient(client);
        context.setComponentFactory(factory);
        context.setInEditMode(true);
        // Get information from the Request URI
        const requestPath = ('/' + params.path.map(decodeURIComponent).join('/')).replace(/^(\/ui){0,1}(\/cms){0,1}(\/content){0,1}\//i, '');
        const slugs = requestPath.split('/');
        const locale = channel.locales.some(x => x.slug == slugs[0]) ? slugs[0] : channel.defaultLocale;
        if (context.isDebug)
            console.log(`[OnPageEdit] Inferred content locale from path: ${locale}`);
        const [contentId, workId] = getContentIds();
        context.setLocale(channel.localeToGraphLocale(locale));
        const contentLink = {
            id: contentId,
            workId: workId,
            guidValue: null,
            locale: locale
        };
        const variables = {
            ...contentLink,
            locale: contentLink.locale,
            isCommonDraft: !contentLink.workId ? true : null
        };
        if (context.isDebug) {
            console.log("[OnPageEdit] Requested content:", JSON.stringify(variables));
            console.log("[OnPageEdit] Creating GraphQL Client:", token);
        }
        try {
            const contentInfo = await getContentById(client, variables);
            const contentItem = (contentInfo?.Content?.items ?? [])[0];
            const contentType = Utils.normalizeContentType(contentItem?.contentType);
            // Return a 404 if the content item or type could not be resolved
            if (!contentItem) {
                console.warn(`[OnPageEdit] The content item for ${JSON.stringify(variables)} could not be loaded from Optimizely Graph`);
                return notFound();
            }
            if (!contentType) {
                console.warn(`[OnPageEdit] The content item for ${JSON.stringify(variables)} did not contain content type information`);
                return notFound();
            }
            if (context.isDebug) {
                const contentItemId = contentItem?.id;
                console.log("[OnPageEdit] Resolved content:", JSON.stringify({
                    id: contentItemId?.id,
                    workId: contentItemId?.workId,
                    guidValue: contentItemId?.guidValue,
                    locale: contentItem.locale?.name,
                    type: (contentItem.contentType ?? []).slice(0, -1).join('/')
                }));
            }
            // Store the editable content so it can be tested
            context.setEditableContentId(contentLink);
            // Render the content, with edit mode context
            const isPage = contentItem.contentType?.some(x => x?.toLowerCase() == "page") ?? false;
            const loadedContentId = Utils.normalizeContentLinkWithLocale({ ...contentItem?.id, locale: contentItem?.locale?.name });
            const Layout = isPage ? PageLayout : React.Fragment;
            const output = _jsxs(_Fragment, { children: [_jsx(Script, { src: new URL(communicationInjectorPath, client.siteInfo.cmsURL).href, strategy: 'afterInteractive' }), _jsxs(Layout, { locale: locale, children: [_jsx(OnPageEdit, { timeout: refreshDelay, mode: context.inEditMode ? 'edit' : 'preview', className: 'bg-slate-900 absolute top-0 left-0 w-screen h-screen opacity-60 z-50', children: _jsx(RefreshNotice, {}) }), _jsx(CmsContent, { contentType: contentType, contentLink: contentLink, fragmentData: contentItem })] }), _jsxs("div", { className: 'optly-contentLink', children: ["ID: ", loadedContentId?.id ?? "-", " | Version: ", loadedContentId?.workId ?? "-", " | Global ID: ", loadedContentId?.guidValue ?? "-", " | Locale: ", loadedContentId?.locale ?? ""] })] });
            return output;
        }
        catch (e) {
            console.error("[OnPageEdit] Caught error", e);
            return notFound();
        }
    }
    return EditPage;
}
export default createEditPageComponent;
//# sourceMappingURL=page.js.map