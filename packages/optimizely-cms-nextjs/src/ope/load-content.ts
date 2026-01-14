import type { ContentLinkWithLocale, IOptiGraphClient } from "@remkoj/optimizely-graph-client";
import type { GetContentByIdMethod, ContentRequest } from "./types.js";
import { localeToGraphLocale } from '@remkoj/optimizely-graph-client/utils';
import { Utils } from '@remkoj/optimizely-cms-react/rsc';

export async function loadContent(contentRequest: Omit<ContentRequest, 'token' | 'ctx'>, client: IOptiGraphClient, getContentById?: GetContentByIdMethod)
{
  const contentLink: ContentLinkWithLocale = {
    key: contentRequest.key,
    changeset: contentRequest.changeset,
    isInline: false,
    variation: contentRequest.variation ? contentRequest.variation.include == "SOME" ? contentRequest.variation.value.join(',') : null : undefined,
    version: contentRequest.version,
    locale: (contentRequest.version ? undefined : Array.isArray(contentRequest.locale) ? contentRequest.locale[0] : contentRequest.locale) ?? undefined
  }

  const contentInfo = getContentById ? await getContentById(client, {
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
  }) : undefined;

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
  const contentType = contentItem ? Utils.normalizeContentType(
    contentItem?._metadata.types
  ) : undefined;

  if (contentItem) {
    contentLink.key = contentItem._metadata.key;
    contentLink.locale = contentItem._metadata.locale;
    contentLink.version = contentItem._metadata.version;
  }

  if (client.debug) {
    console.log(
      '⚪ [OnPageEdit] Resolved content:',
      JSON.stringify({
        ...contentLink,
        type: contentItem?.contentType ? contentItem.contentType.join('/') : undefined,
      })
    )
  }

  return { contentLink, contentItem, contentType }
}

export default loadContent
