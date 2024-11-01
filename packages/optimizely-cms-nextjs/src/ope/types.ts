import { type ComponentType, type PropsWithChildren } from 'react'
import { type ClientFactory } from '@remkoj/optimizely-graph-client'
import { type GraphQLClient } from 'graphql-request'
import { type ContentQueryProps } from '@remkoj/optimizely-cms-react/rsc'

export type ContentRequest = (Omit<ContentQueryProps<string>, 'path'> & { path: string | null, token: string, ctx: 'edit' | 'preview' })

type ServerPageProps = { params: Record<string,string | Array<string>>, searchParams: Record<string,string>}
export type EditPageComponent<T extends ServerPageProps = EditPageProps> = ({ params, searchParams }: T) => Promise<JSX.Element>

export type EditPageProps = {
    params: {
        path?: string[] | string
        lang?: string
    },
    searchParams: {
        preview_token: string
        key?: string
        ver?: string
        loc?: string
        ctx?: 'edit' | 'preview'
        path?: string
        epieditmode?: string
    }
}

export type ValidatedEditPageProps = {
    params: {
        path?: string[] | string
        lang?: string
    },
    searchParams: {
        preview_token: string
    } & ({
        key: string
        ver: string
        loc: string
        ctx: 'edit' | 'preview'
        path?: string
        epieditmode: never
    } | {
        key: never
        ver: never
        loc: never
        ctx: never
        path: never
        epieditmode: 'true' | 'false'
    })
}

export type EditViewOptions = {
    /**
     * The message to show to the editor when awaiting the data to be updated
     * in ContentGraph
     */
    refreshNotice: ComponentType<{}>

    /**
     * The layout to use when rendering a page component
     */
    layout: ComponentType<PropsWithChildren<{locale: string}>>

    /**
     * The fourth step of the handling of a Preview/On-Page-Edit view,
     * which actually loads the data of content to be shown to the 
     * editor.
     */
    loader: GetContentByIdMethod

    /**
     * The third step of the handling of a Preview/On-Page-Edit view,
     * which gets the Optimizely Graph client for the token/auth method
     * inferred by the contentResolver.
     * 
     * @param       token       The token to be used
     * @returns     The Optimizely Graph Client
     */
    clientFactory: ClientFactory

    /**
     * If provided, this allows to override the CommunicationInjector
     * path.
     */
    communicationInjectorPath: string

    /**
     * The second step of the handling of a Preview/On-Page-Edit view,
     * this actually extracts the requested content identification info
     * from the path and search params
     * 
     * @param       props       The page path props and search params
     * @returns     The requested content information
     */
    contentResolver: (props: ValidatedEditPageProps) => ContentRequest | undefined

    /**
     * This is the first step of the handling of a Preview/On-Page-Edit view,
     * where the parameters should be validated to ensure this is a correct
     * preview/on-page-edit request.
     * 
     * @param       props               The page path props and search params
     * @param       throwOnInvalid      Whether an error must thrown on invalid data
     * @param       isDevelopment       Whether this request runs in development mode
     * @returns     If the request is valid
     */
    requestValidator: (props: EditPageProps, throwOnInvalid?: boolean, isDevelopment?: boolean) => props is ValidatedEditPageProps
}

export type GetContentByIdData<LocaleType = string> = {
    content: {
        total: number,
        items: Array<{
            _metadata: {
                key: string,
                locale: LocaleType
                types: Array<string>
                displayName: string
                version?: string | null
                url?: {
                    base?: string | null
                    hierarchical?: string | null
                    default?: string | null
                } | null
            },
            _type: string
            [fieldName: string]: any
        }>
    }
}
export type GetContentByIdMethod = <LocaleType = string>(client: GraphQLClient, variables: ContentQueryProps<LocaleType>) => Promise<GetContentByIdData<LocaleType>>
