/// <reference types="react" />
import 'server-only';
import type { CmsContentProps } from './types';
export type { CmsContentProps } from './types';
/**
 * React Server Side component for the CmsContent
 *
 * @param     param0
 * @returns
 */
export declare const CmsContent: <LocalesType = string>({ contentType, contentTypePrefix, contentLink: rawContentLink, children, fragmentData }: CmsContentProps<LocalesType>) => Promise<JSX.Element>;
export default CmsContent;
