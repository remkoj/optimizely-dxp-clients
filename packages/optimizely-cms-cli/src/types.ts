import type { Argv } from 'yargs'
import type { CommandModule } from 'yargs'
import type { CmsIntegrationApiOptions } from '@remkoj/optimizely-cms-api'

export type OptiCmsArgs<P extends Record<string,any> = {}> = {
    cms_url: URL;
    client_id: string;
    client_secret: string;
    user_id: string
    verbose: boolean

    /**
     * The working directory for the CLI
     */
    path: string

    /**
     * The relative path from the working directory to the folder holding the
     * components.
     */
    components: string
} & P

export type OptiCmsArgsWithConfig<P extends Record<string,any> = {}> = { 
    _config: CmsIntegrationApiOptions,
    path: string,
    components: string
} & Omit<OptiCmsArgs<P>, "client_id" | "client_secret" | "cms_url" | "user_id" | "verbose" | "path" | "components">

export type OptiCmsApp<E extends Record<string,any> = {}> = Argv<OptiCmsArgs<E>>
export type CliModuleBase<P extends Record<string,any> = {}> = CommandModule<OptiCmsArgs, OptiCmsArgs<Partial<P>>>
export type CliModule<P = {}> = Pick<Required<CliModuleBase<P>>, 'command' | 'describe'> & Omit<CliModuleBase<P>, 'command' | 'describe'>
export type CliModuleList = CliModuleBase<any>[]