/// <reference types="react" />
import { type ComponentFactory } from "../../types";
export type RichTextProps = {
    /**
     * The component factory used for this rich text content
     */
    factory: ComponentFactory;
    /**
     * The rich text to render, provided as either a HTML string or JSON encoded
     * structured data.
     */
    text: string | null | undefined;
};
export type RichTextTextNode = {
    text: string;
};
export type RichTextData = {
    type: string;
    children?: Array<RichTextData | RichTextTextNode>;
};
export declare function isRichTextData(toTest: any): toTest is RichTextData;
export declare function isRichTextText(toTest: any): toTest is RichTextTextNode;
export declare const RichText: (props: RichTextProps) => JSX.Element;
export default RichText;
