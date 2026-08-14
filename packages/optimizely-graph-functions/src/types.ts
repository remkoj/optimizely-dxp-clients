import type { FragmentDefinitionNode, OperationDefinitionNode } from 'graphql'
import type { CmsIntegrationApiOptions } from '@remkoj/optimizely-cms-api'
import type { ContentTypeTarget } from './generator/virtual-location'

// Create preset configuration
import type { ClientPresetConfig as ClientPresetOptions } from '@graphql-codegen/client-preset'

/**
 * Full configuration for the Optimizely Graph codegen preset, combining
 * `@graphql-codegen/client-preset` options with the plugin and transform options.
 */
export type PresetOptions = ClientPresetOptions & PluginOptions & TransformOptions

/**
 * Configuration for the `optly-functions` codegen plugin that generates
 * typed wrapper functions for named Optimizely Graph queries.
 */
export type PluginOptions = {
  /** Names of the GraphQL queries to expose as typed functions. Defaults to `['getContentType', 'getContentByPath', 'getContentById']`. */
  functions?: string[],
  /** When `true`, the inlined query string inside each generated function is pretty-printed. Defaults to `false`. */
  prettyPrintQuery?: boolean,
  /** Import path to the generated GraphQL client module. Defaults to `"./graphql"`. */
  clientPath?: string
}

export type TransformOptions = {
  /**
   * Configure which fragments are spread into the built-in partial fragments.
   * When overriding a built-in fragment it loses its default injection points;
   * use this to restore them.
   *
   * Auto-generated fragments (via the `opti-cms:/` protocol) are injected
   * automatically. Fragments in files whose name contains a target name just
   * before the extension are also auto-included, e.g.
   * `HeroBlock.ComponentData.ElementData.graphql` injects into both
   * `ComponentData` and `ElementData`.
   *
   * Valid `into` targets:
   * - `PageData`           — page and experience types (`_page` / `_experience` baseType)
   * - `ComponentData`      — general-purpose components and blocks (`_component` baseType; replaces `BlockData`)
   * - `SectionData`        — Visual Builder section layout types (`_section` baseType)
   * - `ElementData`        — components with the `elementEnabled` composition behavior
   * - `SectionElementData` — components with the `sectionEnabled` composition behavior
   * - `FormElementData`    — components with the `formsElementEnabled` composition behavior
   * - `MediaData`          — media asset types (`_media` / `_image` / `_video` baseType)
   * - `BlockData`          — deprecated alias for `ComponentData`
   */
  injections?: Injection[],

  /**
   * Define whether the injection process should cleanup targeted fragments
   * from the affected queries & fragments. Defaults to "true".
   * 
   * Possible options:
   * - `true`: Clean the targeted fragment spreads and proceed to remove the following fragment spreads: `ComponentData`, `BlockData`, `PageData`
   * - `false`: Do not perform any cleaning
   * - `string[]`: Remove only the listed fragment spreads after processing
   */
  cleanup?: boolean | string[]

  /**
   * Enable verbose output and generate `opti.generated.graphql` showing all
   * built-in and auto-generated queries & fragments. Defaults to `false`.
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
   * The named injection target into which matching fragments are spread.
   * Must be one of the built-in targets listed on `TransformOptions.injections`.
   * No injection occurs when neither `nameRegex` nor `pathRegex` is provided.
   */
  into: ContentTypeTarget | string,
  /** Regex matched against fragment names to select fragments for injection. */
  nameRegex?: string,
  /** Regex matched against source file paths to select fragments for injection. */
  pathRegex?: string
}

/** Describes a resolved (or failed) match between a document and a named injection target. */
export type IntoMatchType = {
  docId: number,
  path?: string,
  match: {
    defId: number,
    data: OperationDefinitionNode | FragmentDefinitionNode
  } | null
}

/** Makes every property of `T` required and non-nullable. */
export type Mandatory<T> = { [P in keyof T]-?: NonNullable<T[P]> }
/** Makes the properties listed in `K` required on type `T`, leaving the rest unchanged. */
export type WithRequiredProp<T, K extends keyof T> = Omit<T, K> & Pick<Mandatory<T>, K>
/** Removes `readonly` from all properties of `T`. */
export type Writeable<T> = { -readonly [P in keyof T]: T[P] }