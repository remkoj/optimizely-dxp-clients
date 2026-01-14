import { type Types } from '@graphql-codegen/plugin-helpers'
import { parse } from 'graphql'
import * as OptiCMS from './cms'

import { PropertyCollisionTracker, DocumentGenerator, VirtualLocation } from './generator'

export * as Tools from './tools'

type LoaderConfig = {
  cwd: string,
  pluginContext?: {
    [key: string]: any;
  }
}

type LoaderFunction = (documentUri: string, config: LoaderConfig) => Promise<Types.DocumentFile | undefined | void>

const collisionTracker: PropertyCollisionTracker = new PropertyCollisionTracker()

const ContentTypeLoader: LoaderFunction = async (documentUri, config) => {
  collisionTracker.cwd = config.cwd;

  const parsedData = VirtualLocation.parse(documentUri)
  if (!parsedData)
    return undefined

  const { type: loaderType, contentTypeBase: baseType, contentTypeKey, forProperty: isForProperty } = parsedData;
  const allContentTypes = await OptiCMS.getContentTypes();
  const generator = new DocumentGenerator(allContentTypes);

  let rawSDL: string|undefined;
  if (loaderType === "target") {
    rawSDL = generator.buildInjectionTarget(`_${ contentTypeKey }`)
  } else {
    const contentType = await OptiCMS.getContentType(contentTypeKey);
    if (!contentType)
      throw new Error(`ContentType with key ${contentTypeKey} cannot be loaded (Base: ${baseType})`)

    if (contentType.baseType !== baseType)
      throw new Error(`ContentType base types don't match, expected ${baseType} but received ${contentType.baseType}`)

    rawSDL = loaderType === 'fragment' ?
      generator.buildFragment(contentType, (name) => '_' + name, isForProperty, collisionTracker) :
      generator.buildGetQuery(contentType, (name) => '_' + name, collisionTracker)
  }

  return rawSDL ? {
    document: parse(rawSDL),
    location: documentUri,
    hash: documentUri,
    rawSDL
  } : undefined
}


export default ContentTypeLoader
