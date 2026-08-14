import { type Types } from '@graphql-codegen/plugin-helpers'
import { parse } from 'graphql'
import { OptiCmsProtocol } from './generator/virtual-location'

/** Configuration injected by the codegen runner for each loader invocation. */
type LoaderConfig = {
  pluginContext?: {
    [key: string]: unknown;
  }
}

/** Signature expected by the graphql-codegen custom document loader protocol. */
type LoaderFunction = (documentUri: string, config: LoaderConfig) => Promise<Types.DocumentFile | undefined | void>

/**
 * Custom loader for embedded Optimizely CMS 12/13 fragments & queries. It 
 * requires the document to be specified as an supported URI.
 *
 * `opti-cms:/(fragments|queries)/(12|13)`
 * 
 * @param   documentUri     The identifier of the embedded fragments/queries to load
 * @param   config          The configuration
 */
const EmbeddedLoader: LoaderFunction = async (documentUri) => {
  const docId = new URL(documentUri)
  if (docId.protocol != OptiCmsProtocol)
    throw new Error("[Optimizely Graph Functions - Embedded Documents] Unsupported protocol, only the \"opti-cms:\" protocol is supported")

  try {
    const parsed = docId.pathname.split('/').filter(x => x && x.length > 0);
    const requireTarget = `./documents/${parsed.at(0) ?? 'undefined'}.cms${parsed.at(1) ?? '13'}`;
    
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const rawData = require(requireTarget).default
    return generateDocument(rawData, documentUri)
  } catch (e) {
    console.error(e)
    throw e
  }
}

/**
 * Parse raw SDL string(s) into a `Types.DocumentFile` at the given virtual location.
 * Returns `undefined` when `rawData` is `undefined`.
 */
function generateDocument(rawData: undefined | string | string[], location?: string): Types.DocumentFile | undefined {
  if (rawData == undefined)
    return undefined
  const rawSDL = '\n'+(Array.isArray(rawData) ? rawData.join("\n\n") : rawData).trim();
  const document = parse(rawSDL)

  return {
    document,
    location,
    rawSDL,
    hash: location
  }
}

export default EmbeddedLoader