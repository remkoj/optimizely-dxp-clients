import { type CmsIntegrationApiClient as CmsApiClient } from '@remkoj/optimizely-cms-api'
import figures from 'figures'
import createDeepMerge from '@fastify/deepmerge'
import { SchemaObject } from 'ajv'

type RefSchema = { "$ref": string }
type BaseSchema = {
  type: string
  required?: string[]
  description?: string
  title?: string
  format?: string
  [x: string]: any
  properties?: {
    [propName: string]: BaseSchema | RefSchema
  }
  allOf?: Array<BaseSchema | RefSchema>
  enum?: Array<string>
}
type TypedSchema = SchemaObject & BaseSchema & {
  definitions?: {
    [defName: string]: BaseSchema
  }
}

const deepmerge = createDeepMerge();

export async function loadSchema(client: CmsApiClient, schemaName: string | string[]): Promise<{ title: string, schema: TypedSchema }[]> {
  const schemas = Array.isArray(schemaName) ? schemaName : [schemaName]

  process.stdout.write(`${figures.arrowRight} Downloading current JSON Schema\n`)
  const spec = await client.getOpenApiSpec()
  const specSchemas = spec.components?.schemas ?? {}
  process.stdout.write(`  ${figures.tick} Complete\n`)

  const result: { title: string, schema: TypedSchema }[] = []
  process.stdout.write(`\n${figures.arrowRight} Constructing schema for ${schemas.join(', ')}\n`)
  for await (const schema of schemas) if (specSchemas[schema]) {
    const definitions = {}
    const processedSchema = processSchema(specSchemas[schema], definitions, spec)
    const jsonSchema: TypedSchema = {
      //"$schema": "https://json-schema.org/draft-07/schema",
      "$id": `https://api.cms.optimizely.com/schema/${schema}`,
      type: "object",
      title: schema,
      ...processedSchema,
      definitions
    };
    result.push({
      title: schema,
      schema: postProcessDefintions(jsonSchema)
    })
    process.stdout.write(`  ${figures.tick} Constructed schema of ${schema}\n`)
  }
  return result
}

export default loadSchema

function postProcessDefintions(jsonSchema: TypedSchema): TypedSchema {
  if (!jsonSchema.definitions)
    return jsonSchema

  for (const definitionName in jsonSchema.definitions) {
    if ((definitionName.endsWith("Property") || definitionName.endsWith("ListItem")) && jsonSchema.definitions[definitionName].properties) {
      const type = jsonSchema.definitions[definitionName].properties?.type
      if (isRefSchema(type)) {
        const typeSchema = resolveRefSchema(type, jsonSchema)
        if (typeSchema && typeSchema.type === 'string' && Array.isArray(typeSchema.enum)) {
          let typeValue = definitionName.substring(0, definitionName.length - 8)
          typeValue = typeValue[0].toLowerCase() + typeValue.substring(1)
          typeValue = typeValue === 'list' ? 'array' : typeValue
          typeValue = typeValue === 'jsonString' ? 'json' : typeValue
          if (typeSchema.enum.includes(typeValue)) {
            const newTypeDef = deepmerge({}, typeSchema)
            newTypeDef.enum = newTypeDef.enum.filter((x: string) => x === typeValue)
            jsonSchema.definitions[definitionName].properties.type = newTypeDef as BaseSchema
          }
        }
      }
    }
  }

  return jsonSchema
}

/**
 * Schema normalization to tranform the schema from a .Net generated OpenAPI Schema
 * to a AJV compatible JSON Schema
 * 
 * @see   https://ajv.js.org/
 * @param schema 
 * @param defs 
 * @param spec 
 * @returns 
 */
function processSchema(schema: BaseSchema | BaseSchema[], defs: { [name: string]: BaseSchema }, spec: TypedSchema, mergeAllOf: boolean = true): typeof schema extends Array<any> ? (BaseSchema | RefSchema)[] : (BaseSchema | RefSchema) {
  if (Array.isArray(schema))
    return schema.map(s => processSchema(s, defs, spec, mergeAllOf)) as ((BaseSchema | RefSchema)[]) & (BaseSchema | RefSchema)

  if (typeof schema !== 'object' || schema === null)
    return schema

  const props = Object.getOwnPropertyNames(schema);
  if (props.length === 1 && props[0] === '$ref') {
    const ref = schema['$ref'] as string;
    if (isLocalRef(ref)) {
      const refName = getLocalRefName(ref)
      if (!defs[refName]) {
        const refItem = resolveLocalRef(ref, spec)
        defs[refName] = processSchema(refItem, defs, spec, mergeAllOf) as BaseSchema
      }
      const newRef = `#/definitions/${refName}`
      return { "$ref": newRef }
    } else {
      return schema
    }
  } else if (mergeAllOf && props.includes('allOf') && Array.isArray(schema['allOf'])) {
    // process all of
    const newObject = props.reduce<Omit<BaseSchema, 'allOf'>>((generated, propName) => {
      if (propName != 'allOf')
        generated[propName] = schema[propName]
      return generated
    }, {} as BaseSchema)

    const allOfSchemas = schema['allOf'].map((subschema) => {
      const resolvedSchema = isRefSchema(subschema) ? resolveRefSchema(subschema, spec) : subschema;
      const resolved = processSchema(resolvedSchema, defs, spec, mergeAllOf) as BaseSchema
      return resolved;
    })

    const merged = allOfSchemas.reduce<BaseSchema>((previous, current) => deepmerge(previous, current) as BaseSchema, newObject as BaseSchema)
    if (newObject['description'])
      merged['description'] = newObject['description']
    if (newObject['title'])
      merged['title'] = newObject['title']

    return merged;
  } else {
    const newSchema: BaseSchema = {} as BaseSchema
    for (const key of props) {
      if (key === 'pattern' && typeof schema[key] === 'string') {
        newSchema[key] = safeCreateUnicodeRegExp(schema[key])
        /*} else if (key === 'readOnly' && schema[key] === true) {
          return undefined*/
      } else if (['additionalProperties', 'required', 'properties', 'discriminator'].includes(key) && typeof schema[key] !== 'object') {
        // Ignore additional properties value
      } else if (key === 'discriminator' && !Array.isArray(schema['oneOf'])) {
        //Ignore discriminators without a oneOf
      } else if (key === 'discriminator' && !schema['type']) {
        newSchema.type = 'object'
      } else {
        const keyVal = processSchema(schema[key], defs, spec, mergeAllOf)
        if (keyVal !== undefined)
          newSchema[key] = keyVal
      }
    }
    return newSchema
  }
}

function isRefSchema(schema: BaseSchema['properties'][string]): schema is { "$ref": string } {
  if (typeof schema != 'object' || schema == null)
    return false
  return Object.getOwnPropertyNames(schema).length === 1 && typeof schema['$ref'] === 'string'
}

function resolveRefSchema(schema: BaseSchema['properties'][string], spec: TypedSchema): BaseSchema | undefined {
  if (!isRefSchema(schema))
    return undefined
  return resolveLocalRef(schema['$ref'], spec);
}

function isLocalRef(ref: any): ref is string {
  return typeof ref === 'string' && ref.startsWith('#')
}

function getLocalRefName(ref: string): string | undefined {
  if (!isLocalRef(ref))
    return undefined
  const refPath = ref.substring(2).split('/')
  return refPath.at(refPath.length - 1)
}

function resolveLocalRef(ref: string, spec: TypedSchema): BaseSchema | undefined {
  const refPath = ref.substring(2).split('/')
  return refPath.reduce((integrator, current) => {
    return integrator ? integrator[current] : undefined
  }, spec)
}

const replaceEscapedChars: [RegExp, string][] = [
  [new RegExp('\\\\ ', 'g'), ' '],
  [new RegExp('\\\\!', 'g'), '!'],
  [new RegExp('\\\\"', 'g'), '"'],
  [new RegExp('\\\\#', 'g'), '#'],
  [new RegExp('\\\\%', 'g'), '%'],
  [new RegExp('\\\\&', 'g'), '&'],
  [new RegExp("\\\\'", 'g'), "'"],
  [new RegExp('\\\\,', 'g'), ','],
  [new RegExp('\\\\-', 'g'), '-'],
  [new RegExp('\\\\:', 'g'), ':'],
  [new RegExp('\\\\;', 'g'), ';'],
  [new RegExp('\\\\<', 'g'), '<'],
  [new RegExp('\\\\=', 'g'), '='],
  [new RegExp('\\\\>', 'g'), '>'],
  [new RegExp('\\\\@', 'g'), '@'],
  [new RegExp('\\\\_', 'g'), '_'],
  [new RegExp('\\\\`', 'g'), '`'],
  [new RegExp('\\\\~', 'g'), '~'],
  [new RegExp('\\\\[zZ]', 'g'), '$'],
];

export function safeCreateUnicodeRegExp(pattern: string): string {
  for (const unEscape of replaceEscapedChars) {
    pattern = pattern.replace(unEscape[0], unEscape[1]);
  }

  return pattern;
}