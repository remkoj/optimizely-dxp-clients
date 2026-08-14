import type { Types } from '@graphql-codegen/plugin-helpers'
import { visit, print, Kind, type FragmentDefinitionNode, type SelectionNode, type FragmentSpreadNode, type DocumentNode, SelectionSetNode } from 'graphql'
import { VirtualLocation } from '../generator'
import type { PresetOptions, Injection, TransformOptions } from '../types'
import { defaultOptions, pickTransformOptions } from "./options"
import { isFragmentOrOperation, flatten } from './tools'
import { InjectionMap } from './_injection-map';

/**
 * Check all fragments within the project and ensure that there's at least a fragment for every
 * content type defined in Optimizely CMS. This assumes that when overriding the fragments the
 * project will ensure that the injections are correct.
 * 
 * @param files 
 * @param options 
 * @returns 
 */
export async function performInjections(files: Types.DocumentFile[], schema: DocumentNode, options: PresetOptions): Promise<Types.DocumentFile[]> {
  // Create context
  const config: Readonly<Required<TransformOptions>> = { ...defaultOptions, ...pickTransformOptions(options) };
  const injections = buildInjectionMap(files, config);

  // Extract the cleanup that must be done
  const cleanUpFragmentSpreads = config.cleanup === true ?
    Array.from(injections.keys()) :
    Array.isArray(config.cleanup) ? config.cleanup.filter((c) => typeof(c) === 'string' && c.length > 0) : [];

  // Helper to test if a Selection node is a FragmentSpreadNode, with type-safety
  function isFragmentSpread(node: SelectionNode): node is FragmentSpreadNode {
    return node.kind === Kind.FRAGMENT_SPREAD
  }

  // Run the actual transformation
  const transformedFiles = files.map(file => {
    if (!file.document) return file;
    let documentChanged = false;
    const document = visit(file.document, {

      // Modify selection sets
      SelectionSet: {
        leave(node, key, parent, path, ancestors) {
          // Read the context
          const parentQueryOrFragment = [...ancestors.flatMap(flatten)].reverse().filter(isFragmentOrOperation).at(0);
          const existingSpreads = node.selections.filter(isFragmentSpread).map((selection) => selection.name.value);
          const targets = existingSpreads.filter((spread) => injections.has(spread));

          // Only continue if we've got work todo
          if (targets.length === 0 || !parentQueryOrFragment) return;

          if (config.verbose)
            console.log(`➡  Found usage of ${ targets.join(', ') } within ${ parentQueryOrFragment.kind === Kind.FRAGMENT_DEFINITION ? 'fragment' : 'query' } ${ parentQueryOrFragment.name?.value ?? 'anonymous' } in ${ file.location }`)

          // Inject component data when BlockData is found and ComponentData is not (yet)
          // specified. Also force-output a warning in this case.
          if (targets.includes(VirtualLocation.ContentTypeTarget.BlockData))
            console.warn(`⚠️  The ${ parentQueryOrFragment.name?.value ?? 'anonymous' } ${ parentQueryOrFragment.kind.replace('Definition', '') } uses the deprecated BlockData target, use ComponentData instead.${ file.location ? ` In file: ${ file.location }` : '' }`);

          // Change tracker
          let selectionsChanged = false;
          let selections = [...node.selections];

          // Append all fragments
          injections.getAll(targets).forEach((target) => {
            if (!existingSpreads.includes(target.name)) {
              const newSpread: FragmentSpreadNode = {
                kind: Kind.FRAGMENT_SPREAD,
                directives: [],
                name: {
                  kind: Kind.NAME,
                  value: target.name
                }
              }
              selections.push(newSpread);
              existingSpreads.push(target.name);
              selectionsChanged = true;
            }
          });
         
          // Run the cleanup if that's required, using a reducer instead of
          // filter so we can handle side-effects while filtering.
          if (cleanUpFragmentSpreads.length > 0) {
            const initialLength = selections.length;
            selections = selections.filter((selection)=> !isFragmentSpread(selection) || !cleanUpFragmentSpreads.includes(selection.name.value));
            if (initialLength !== selections.length) {
              selectionsChanged = true;
            }
          }
          
          // Only return the new node, when the selections have changed
          if (selectionsChanged) {
            documentChanged = true;
            return { ...node, selections: selections } as SelectionSetNode
          }
        }
      },

      // Remove fragments if cleanup is enabled
      // **Note:** this is too agressive, it'll break the DTS logic from the client preset
      /*FragmentDefinition: {
        enter(node) {
          if (cleanUpFragmentSpreads.includes(node.name.value)) {
            documentChanged = true;
            return null; // Remove the definition
          }
        }
      }*/
    });

    // Output the new file if changed, otherwise keep the current one
    return documentChanged ? { 
      ...file,
      document: document,
      rawSDL: print(document)
    } as Types.DocumentFile : file;
  })

  return transformedFiles;
}

export default performInjections

function getTargetsFromName(location?: string | null, targets: string[] = []): false | string[] {
  if (typeof(location) !== 'string' || location.length === 0)
    return false;

  const safeTargets = targets.filter((x) => /^[a-zA-Z]+$/.test(x));
  const regexDefinition = `((\\.(${ safeTargets.join('|') })){1,})\\.(graphql|(j|t)s(x){0,1})`;
  const regex = new RegExp(regexDefinition, 'gm');
  const targetsInName = regex.exec(location)?.at(1)?.split('.')?.filter(Boolean) ?? [];
  return targetsInName.length === 0 ? false : targetsInName;
}

/** Create a map all injections that must be done */
function buildInjectionMap(documents: Types.DocumentFile[], config: Readonly<Required<TransformOptions>>): InjectionMap
{
  // Decompose the config for easier usage
  const { verbose, injections } = config;

  // Create the map, ignoring the BlockData target
  const defaultTargets = getInjectionTargets(injections).filter((target) => target !== VirtualLocation.ContentTypeTarget.BlockData);
  const injectionMap = new InjectionMap(defaultTargets);

  if (verbose)
    console.log(`🛠️  [Optimizely] Using injection targets: ${ defaultTargets.join(', ')}`)

  // Iterate over the documents and handle the logic
  documents.forEach((document) => {
    // Get the fragments in this file and skip if there're none
    const fragments = getFragments(document);
    if (fragments.length === 0) return;

    // Handle the Opti-CMS Virtual location items
    if (VirtualLocation.isOptiCmsURL(document.location)) {
      // Parse the location and only continue if it's a non-property fragment
      // with at least one injection target
      const { contentTypeKey, injectionTargets, forProperty, type } = VirtualLocation.parse(document.location) ?? { contentTypeKey: 'n/a', injectionTargets: [] as string[], forProperty: false, type: 'fragment' };
      if (forProperty || type !== 'fragment' || injectionTargets.length === 0)
        return;

      // Now register all fragments in the document
      fragments.forEach((fragment) => {
        // Harden against an improper sequence of documentTransforms
        const fragementName = fragment.name.value.startsWith('_') ? fragment.name.value.substring(1) : fragment.name.value
        injectionTargets.forEach((target) => {
          injectionMap.append(target, {
            contentType: contentTypeKey,
            definition: fragment,
            name: fragementName,
            location: document.location
          })
        })
      })
    
    // Handle in project files & other files
    } else {
      
      // Frist handle files based upon their name.
      const targetsFromName = getTargetsFromName(document.location, defaultTargets);
      if (targetsFromName) targetsFromName.forEach((target) => {
        fragments.forEach((fragment) => {
          injectionMap.append(target, {
            contentType: fragment.typeCondition.name.value,
            definition: fragment,
            name: fragment.name.value,
            location: document.location
          })
        })
      });

      // Filter the injections to those that are valid for this document and stop
      // if there're none
      const validInjections = getInjectionsByFile(document, injections);
      if (validInjections.length === 0) return;

      // Now check each fragment
      fragments.forEach((fragment) => {
        const fragmentName = fragment.name.value;
        const contentTypeKey = fragment.typeCondition.name.value;
        getInjectionsByFragmentName(fragmentName, validInjections).forEach((injection) => {
          if (targetsFromName && targetsFromName.includes(injection.into))
            return;
          injectionMap.append(injection.into, {
            contentType: contentTypeKey,
            definition: fragment,
            name: fragmentName,
            location: document.location
          });
        });
      });
    }
  });

  // Report the contained items
  // if (verbose)
  //  injectionMap.report(console.log, '➡  ', config.cleanup ? 'replaced by' : 'extended with');
  return injectionMap;
}

/** Construct a list of all injection targets, both default  */
function getInjectionTargets(injections: Injection[])
{
  const newTargets = [...VirtualLocation.getInjectionTargets()];
  let hasWarned = false;
  injections.forEach((injection) => {
    if (!newTargets.includes(injection.into)) newTargets.push(injection.into);
    if (injection.into === VirtualLocation.ContentTypeTarget.BlockData && !hasWarned) { 
      hasWarned = true;
      console.warn(`⚠️  [OPTIMIZELY] The 'BlockData' injection target has been deprecated, change to 'ComponentData'/'ElementData' to get rid of this message. Support will be removed in a future version.`)
    }
  })
  return newTargets;
}

/** Extract all fragment definitions from a document */
function getFragments(file: Types.DocumentFile): ReadonlyArray<Readonly<FragmentDefinitionNode>> {
  const fragments: FragmentDefinitionNode[] = []
  if (file.document) {
    visit(file.document, {
      FragmentDefinition: {
        enter: (node) => fragments.push(node)
      }
    })
  }
  return fragments;
}

/**
 * Return the subset of `injections` that apply to `file` based on `pathRegex`.
 * When an injection has no `pathRegex` it matches every file.
 */
function getInjectionsByFile(file: Types.DocumentFile, injections: Injection[]): Injection[] {
  const applicableInjections = injections.filter(injection => !injection.pathRegex || (new RegExp(injection.pathRegex)).test(file.location ?? ""))
  return applicableInjections ?? []
}

/**
 * Return the subset of `injections` that match `fragmentName` based on `nameRegex`.
 * When an injection has no `nameRegex` it matches every fragment name.
 */
function getInjectionsByFragmentName(fragmentName: string, injections: Injection[]): Array<Injection> {
  const matchingInjections = injections.filter(injection => !injection.nameRegex || (new RegExp(injection.nameRegex)).test(fragmentName))
  return matchingInjections ?? []
}
