/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentTypeMap_V3 } from './ContentTypeMap_V3.js';
import type { LinkMap } from './LinkMap.js';
import type { Optional_string_ } from './Optional_string_.js';
import type { Preset } from './Preset.js';
import type { PropertyTypeMap_V3 } from './PropertyTypeMap_V3.js';
export type ContentSource_V3 = {
    preset?: Preset;
    useTypedFieldNames?: boolean;
    description?: Optional_string_;
    label?: Optional_string_;
    links?: LinkMap;
    propertyTypes?: PropertyTypeMap_V3;
    contentTypes?: ContentTypeMap_V3;
    languages?: Array<string>;
};

