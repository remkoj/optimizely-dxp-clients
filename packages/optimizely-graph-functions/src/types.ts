import type { FragmentDefinitionNode, OperationDefinitionNode } from 'graphql'
import type { CmsIntegrationApiOptions } from '@remkoj/optimizely-cms-api'

// Create preset configuration
import type { ClientPresetConfig as ClientPresetOptions } from '@graphql-codegen/client-preset'

export type PresetOptions = ClientPresetOptions & PluginOptions & TransformOptions

export type PluginOptions = {
  functions?: string[],
  prettyPrintQuery?: boolean,
  clientPath?: string
}

export type TransformOptions = {
  /**
   * Configure fragment injection targets and filters as a set of injection
   * rules.
   */
  injections?: Injection[],

  /**
   * Define whether the injection process should cleanup targeted fragments
   * from the affected queries & fragments. Defaults to "true".
   * 
   * Possible options:
   * - `true`: Clean the targeted fragment spreads and proceed to remove the following fragment spreads: BlockData, PageData
   * - `false`: Do not perform any cleaning
   * - string[]: Remove the listed fragment spreads after processing
   */
  cleanup?: boolean | string[]

  /**
   * Enable verbose output
   */
  verbose?: boolean

  /**
   * Override the keys to login to Optimizely CMS to fully auto-generate
   * fragments during the compilation process.
   */
  cmsClient?: CmsIntegrationApiOptions

  /**
   * Disables the recursive validation of GraphQL-Codegen and updates the
   * rules to ensure that the code is properly generated.
   * 
   * *NOTE:* This requires a custom resolution of the  
   * `@graphql-codegen/visitor-plugin-common` package, which patches an unhandled 
   * infinite loop when the recursive validation has been disabled.
   */
  recursion?: boolean
}

export type Injection = {
  /**
   * The fragment to inject the matching fragments. Matching is configured by
   * `nameRegex` and `pathRegex`, if neither is provided, nothing will be 
   * injected.
   */
  into: string,
  /**
   * A Regex used to match the fragment names that must be injected.
   */
  nameRegex?: string,
  /**
   * A Regex used to match the files from which the fragments must be injected.
   */
  pathRegex?: string
}

export type IntoMatchType = {
  docId: number,
  path?: string,
  match: {
    defId: number,
    data: OperationDefinitionNode | FragmentDefinitionNode
  } | null
}

export type Mandatory<T> = { [P in keyof T]-?: NonNullable<T[P]> }
export type WithRequiredProp<T, K extends keyof T> = Omit<T, K> & Pick<Mandatory<T>, K>
export type Writeable<T> = { -readonly [P in keyof T]: T[P] }