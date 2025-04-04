import type { Argv, CommandModule } from 'yargs'

export type CliArgs = { dxp_url?: string, deploy_domain?: string, app_key?: string, secret?: string, single_key?: string, gateway?: string, verbose?: boolean }
export type CliApp = Argv<CliArgs>
type CliModuleBase<P> = CommandModule<CliArgs, CliArgs & Partial<P>>
export type CliModuleArgs<P = {}> = Argv<CliArgs & Partial<P>>
export type CliModule<P = {}> = Pick<Required<CliModuleBase<P>>, 'command' | 'describe'> & Omit<CliModuleBase<P>, 'command' | 'describe'>
export type CliModuleList = CliModuleBase<any>[]