import type { ContentLinkWithLocale, IOptiGraphClient } from "@remkoj/optimizely-graph-client";
import type { GetContentByIdMethod, ContentRequest } from "./types.js";
import { localeToGraphLocale } from '@remkoj/optimizely-graph-client/utils';
import { ContentType, Utils } from '@remkoj/optimizely-cms-react/rsc';
import { RouteResolver } from "@remkoj/optimizely-graph-client/router";

export type LoadedContentDetails = {
  /**
   * The reference to the content item
   */
  contentLink: ContentLinkWithLocale

  /**
   * The type of the content item
   */
  contentType?: ContentType

  /**
   * The data of the content item, which
   * will only be available when a content
   * loading function has been provided.
   */
  contentItem?: any
}

export async function loadContent(contentRequest: Omit<ContentRequest, 'token' | 'ctx'>, client: IOptiGraphClient, getContentById?: GetContentByIdMethod) : Promise<LoadedContentDetails>
{
  return getContentById ?
    loadContentByLoader(contentRequest, client, getContentById) :
    loadContentWithoutData(contentRequest, client);
}

async function loadContentWithoutData(contentRequest: Omit<ContentRequest, 'token' | 'ctx'>, client: IOptiGraphClient) : Promise<LoadedContentDetails> {
  const contentLink: ContentLinkWithLocale = {
    key: contentRequest.key,
    changeset: contentRequest.changeset,
    isInline: false,
    variation: contentRequest.variation ? contentRequest.variation.include == "SOME" ? contentRequest.variation.value.join(',') : null : undefined,
    version: contentRequest.version,
    locale: (contentRequest.version ? undefined : Array.isArray(contentRequest.locale) ? contentRequest.locale[0] : contentRequest.locale) ?? undefined
  }
  const router = new RouteResolver(client);
  const info = await router.getContentInfoById(contentLink.key, contentLink.locale, contentLink.version ?? undefined);

  const contentType = info?.contentType;
  if (info) {
    contentLink.version = info.version
    contentLink.variation = info.variation
    contentLink.locale = info.locale
    contentLink.changeset = info.changeset
  }

  return { contentLink, contentType }
}

async function loadContentByLoader(contentRequest: Omit<ContentRequest, 'token' | 'ctx'>, client: IOptiGraphClient, getContentById: GetContentByIdMethod) : Promise<LoadedContentDetails> {
  const contentInfo = await getContentById(client, {
    ...contentRequest,
    locale:
      contentRequest.locale && contentRequest.locale.length > 0
        ? localeToGraphLocale(
            Array.isArray(contentRequest.locale)
              ? contentRequest.locale.at(0)
              : contentRequest.locale
          )
        : undefined,
    changeset: client.getChangeset(),
  }).catch((e) => {
    console.warn(
    '🟠 [OnPageEdit][loadContent] getContentById for ' +
      JSON.stringify(contentRequest) +
      ' returned an error', e
    );
    return undefined
  });

  const contentLink: ContentLinkWithLocale = {
    key: contentRequest.key,
    changeset: contentRequest.changeset,
    isInline: false,
    variation: contentRequest.variation ? contentRequest.variation.include == "SOME" ? contentRequest.variation.value.join(',') : null : undefined,
    version: contentRequest.version,
    locale: (contentRequest.version ? undefined : Array.isArray(contentRequest.locale) ? contentRequest.locale[0] : contentRequest.locale) ?? undefined
  }

  if (contentInfo && (contentInfo?.content?.total ?? 0) > 1) {
    console.warn(
      '🟠 [OnPageEdit][loadContent] getContentById for ' +
        JSON.stringify(contentRequest) +
        ' yielded more then one item, picking first matching'
    )
  }
  const contentItem =
    (Array.isArray(contentInfo?.content?.items)
      ? contentInfo?.content?.items[0]
      : contentInfo?.content?.items) ?? undefined
  const contentType = contentItem?._metadata?.types ? Utils.normalizeContentType(
    contentItem?._metadata.types
  ) : undefined;

  if (contentItem) {
    contentLink.key = contentItem._metadata.key;
    contentLink.locale = contentItem._metadata.locale;
    contentLink.version = contentItem._metadata.version;
  }

  return { contentItem, contentLink, contentType }
}

export default loadContent
