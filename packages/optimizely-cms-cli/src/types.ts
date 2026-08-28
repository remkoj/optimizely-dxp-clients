import type { Argv, CommandModule, ArgumentsCamelCase } from 'yargs'
import type { CmsIntegrationApiOptions } from '@remkoj/optimizely-cms-api'

/**
 * The global arguments accepted by every `opti-cms` command, as parsed by yargs.
 *
 * @typeParam P - Additional, command-specific arguments merged into this type.
 */
export type OptiCmsArgs<P extends Record<string, unknown> = Record<string,unknown>> = {
  /**
   * The URL of the Optimizely CMS instance
   */
  cms_url: URL;
  /**
   * Override for the resolved CMS Integration API base URL
   */
  api_base_url: URL;
  /**
   * The OAuth Client ID used to authenticate against the CMS
   */
  client_id: string;
  /**
   * The OAuth Client Secret used to authenticate against the CMS
   */
  client_secret: string;
  /**
   * Enables verbose/debug logging output
   */
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

/**
 * The arguments available to a command handler after `parseArgs` has resolved
 * CMS credentials into a ready-to-use `_config` object, replacing the raw
 * credential/URL/verbose fields.
 *
 * @typeParam P - Additional, command-specific arguments merged into this type.
 */
export type OptiCmsArgsWithConfig<P extends Record<string, unknown> = Record<string, unknown>> = {
  /**
   * The resolved CMS Integration API client configuration
   */
  _config: CmsIntegrationApiOptions,
  /**
   * The working directory for the CLI
   */
  path: string,
  /**
   * The relative path from the working directory to the folder holding the
   * components.
   */
  components: string
} & Omit<OptiCmsArgs<P>, "client_id" | "client_secret" | "cms_url" | "user_id" | "verbose" | "path" | "components">

/**
 * The yargs application instance used to build and run the `opti-cms` CLI.
 *
 * @typeParam E - Additional, command-specific arguments merged into the argument type.
 */
export type OptiCmsApp<E extends Record<string, unknown> = Record<string, unknown>> = Argv<OptiCmsArgs<E>>

/**
 * The yargs `CommandModule` shape shared by every `opti-cms` command, before
 * the stricter requirements imposed by {@link CliModule} are applied.
 *
 * @typeParam P - Additional, command-specific arguments merged into the argument type.
 */
export type CliModuleBase<P extends Record<string, unknown> = Record<string, unknown>> = CommandModule<OptiCmsArgs, OptiCmsArgs<Partial<P>>>
/**
 * Defines an Optimizely CMS CLI Module, which is a Yargs CommandModule where:
 * - The Command is mandatory
 * - The Description is mandatory
 * - An additional parameters object may be provided to the handler, usefull to prevent double-fetching
 *   when creating "group methods" that combine multiple others
 */
export type CliModule<P extends Record<string, unknown> = Record<string, unknown>, O = unknown> = Pick<Required<CliModuleBase<P>>, 'command' | 'describe'> & Omit<CliModuleBase<P>, 'command' | 'describe' | 'handler'> & {
  handler: (args: ArgumentsCamelCase<OptiCmsArgs<P>>, opts?: O | undefined) => ReturnType<CliModuleBase<P>['handler']>
}
/**
 * A list of registered `opti-cms` command modules, as consumed by
 * `src/commands/index.ts` and the yargs app factory.
 */
export type CliModuleList = CliModuleBase<Record<string, unknown>>[]