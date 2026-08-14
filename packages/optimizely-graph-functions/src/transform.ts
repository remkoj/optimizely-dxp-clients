import type { Types } from '@graphql-codegen/plugin-helpers'
import type { PresetOptions } from './types'
import type { DocumentNode } from 'graphql'

// Import the individual transformers
import { cleanFragments } from "./_transform/cleanFragments"
import { normalizeFragmentNames } from "./_transform/normalizeFragmentNames"
import { normalizeQueryNames } from "./_transform/normalizeQueryNames"
import { performInjections } from "./_transform/performInjections"
import { cleanFragmentSpreads } from "./_transform/cleanSpreads"
import { handleDependDirective } from "./_transform/handleDependDirective"

// Import the individual document generators
import { getComponentDocuments, getInjectionTargetDocuments } from "./_transform/injectComponentDocuments"
import { getPageDocuments } from "./_transform/injectPageQueries"
import { getSectionDocuments } from "./_transform/injectSectionQueries"

// Export the helper functions
export { pickTransformOptions } from "./_transform/options"

/** A single document-transform step: receives the current document set plus preset options and returns the updated set. */
export type TransformFn<T extends PresetOptions = PresetOptions> = (
  files: Types.DocumentFile[],
  schema: DocumentNode,
  options: T
) => Promise<Types.DocumentFile[]> | Types.DocumentFile[]

/**
 * Transforms that exclusively mutate `opti-cms:/` virtual documents.
 * Applied directly inside `buildGeneratesSection` — before
 * `@graphql-codegen/client-preset` calls `processSources` — so the renamed
 * `rawSDL` strings are visible when `gql.ts` keys are captured.
 */
export const OptiCmsTransforms: ReadonlyArray<TransformFn<PresetOptions>> = [
  normalizeFragmentNames, // Promote _-prefixed built-in fragments unless the project overrides them
  normalizeQueryNames,    // Promote _-prefixed built-in queries unless the project overrides them
  cleanFragments,         // Remove fragments that target non-existing types
  cleanFragmentSpreads,   // Remove all fragment spreads that target a fragment that does not exist in the documents
];

/**
 * Ordered pipeline of document transforms registered as `documentTransforms`.
 * These may affect user-authored documents and must run through the standard
 * CodeGen mechanism so every output file sees the same transformed documents.
 *
 * Execution order:
 * 1. `performInjections`     — insert component fragment spreads adjacent to injection targets
 * 2. `handleDependDirective` — strip `@depend`-guarded fields whose schema dependency is absent
 */
export const CmsTransforms: ReadonlyArray<TransformFn<PresetOptions>> = [
  performInjections,      // Run injections of component fragments adjacent to placeholder fragments
  handleDependDirective,  // Remove the "item" field in queries and fragments from the "ContentReference" type if it's not in the schema
];

const TransformProfilerCategory = 'Transforming documents';

function getTransformerName(transformFn: TransformFn<PresetOptions>): string {
  return `Optimizely.CMS.${transformFn.name}`;
}

export async function getGeneratedDocuments(): Promise<Types.CustomDocumentLoader[]>
{
  const generatedDocuments = await Promise.allSettled([
    getPageDocuments(),
    getSectionDocuments(),
    getComponentDocuments(),
    getInjectionTargetDocuments()
  ]);
  return generatedDocuments.flatMap((item) => item.status === 'fulfilled' ? item.value : []);
}

export function configureDocumentTransforms<
  PresetConfig extends PresetOptions = PresetOptions,
  PluginConfig = Record<string,unknown>,
  OptionsType extends Partial<Types.PresetFnArgs<PresetConfig, PluginConfig>> = Types.PresetFnArgs<PresetConfig, PluginConfig>
>(
  options: OptionsType
): Omit<OptionsType, 'documentTransforms'> & Required<Pick<Types.PresetFnArgs<PresetConfig, PluginConfig>, 'documentTransforms'>> {
  const documentTransforms = options.documentTransforms ?? [];
  if (documentTransforms.length === 0) {
    const transforms = CmsTransforms.map((transformFn) => {
      const transformName = getTransformerName(transformFn);
      const transformObject: Types.ConfiguredDocumentTransform<PresetConfig> = {
        name: transformName,
        transformObject: {
          transform: ({ documents, schema, config }) => {
            const cfg = { ...options.presetConfig, ...config }
            if (cfg.verbose)
              console.log(`🛠️  [Optimizely] Running document transformer: ${ transformName }`)
            return options.profiler ?
              options.profiler.run(async () => {
                return transformFn(documents, schema, cfg)
              }, transformName, TransformProfilerCategory) :
              transformFn(documents, schema, cfg)
          }
        },
        config: options.presetConfig
      };
      return transformObject as unknown as Types.ConfiguredDocumentTransform<object>;
    });

    documentTransforms.unshift(...transforms);
  }
  
  return {
    ...options,
    documentTransforms: documentTransforms
  };
}

/**
 * Execute an ordered list of `TransformFn` steps against a document set, passing
 * the result of each step as the input to the next.
 *
 * @param files       The initial document set
 * @param transforms  Ordered array of transform steps to apply
 * @param options     Preset arguments forwarded to each step
 * @returns           The fully-transformed document set
 */
export async function executeDocumentTransforms<T extends PresetOptions = PresetOptions>(files: Types.DocumentFile[], options: Types.PresetFnArgs<T>): Promise<Types.DocumentFile[]> {
  let transformedFiles = [...files];
  const { profiler, presetConfig, schema } = options;
  
  for (const transform of [...OptiCmsTransforms, ...CmsTransforms]) {
    const transformName = getTransformerName(transform);
    transformedFiles = profiler ?
      await profiler.run(async () => await transform(transformedFiles, schema, presetConfig), transformName, TransformProfilerCategory) :
      await transform(transformedFiles, schema, presetConfig);
  }
  return transformedFiles;
}
