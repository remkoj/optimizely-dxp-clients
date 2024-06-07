import { type ComponentType, type PropsWithChildren } from 'react';
import { type ClientFactory } from '@remkoj/optimizely-graph-client';
import { type GraphQLClient } from 'graphql-request';
import { type ContentQueryProps } from '@remkoj/optimizely-cms-react';
export { type ContentQueryProps } from '@remkoj/optimizely-cms-react';
type ServerPageProps = {
    params: Record<string, string | Array<string>>;
    searchParams: Record<string, string>;
};
export type EditPageComponent<T extends ServerPageProps = EditPageProps> = ({ params, searchParams }: T) => Promise<JSX.Element>;
export type EditPageProps = {
    params: {
        path: string[];
    };
    searchParams: Partial<{
        epieditmode: string;
        preview_token: string;
    }>;
};
export type EditViewOptions = {
    /**
     * The message to show to the editor when awaiting the data to be updated
     * in ContentGraph
     */
    refreshNotice: ComponentType<{}>;
    /**
     * The message to show to the editor when an error occured in rendering the
     * on page editing mode
     */
    errorNotice: ComponentType<{
        title: string;
        message: string;
    }>;
    /**
     * The layout to use when rendering a page component
     */
    layout: ComponentType<PropsWithChildren<{
        locale: string;
    }>>;
    /**
     * The base content loader to be used for the edit view
     */
    loader: GetContentByIdMethod;
    /**
     * The factory used to create a new Optimizely Graph Client
     */
    clientFactory: ClientFactory;
    /**
     * If provided, this allows to override the CommunicationInjector
     * path.
     */
    communicationInjectorPath: string;
};
export type GetContentByIdData<LocaleType = string> = {
    content: {
        total: number;
        items: Array<{
            _metadata: {
                key: string;
                locale: LocaleType;
                types: Array<string>;
                displayName: string;
                version?: string | null;
                url?: {
                    base?: string | null;
                    hierarchical?: string | null;
                    default?: string | null;
                } | null;
            };
            _type: string;
            [fieldName: string]: any;
        }>;
    };
};
export type GetContentByIdMethod = <LocaleType = string>(client: GraphQLClient, variables: ContentQueryProps<LocaleType>) => Promise<GetContentByIdData<LocaleType>>;
