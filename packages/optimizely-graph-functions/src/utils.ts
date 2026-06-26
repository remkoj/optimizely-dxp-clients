import type { DefinitionNode, FragmentDefinitionNode, OperationDefinitionNode } from 'graphql'
import type { IntoMatchType, WithRequiredProp } from './types'
import type { PluginOptions } from './index'
import { Kind } from 'graphql'

export function isNotNullOrUndefined<T>(toTest: T | null | undefined) : toTest is T
{
  return toTest ? true : false
}

export function isFragmentDefinitionNode (node?: DefinitionNode) : node is FragmentDefinitionNode
{
  return node?.kind == Kind.FRAGMENT_DEFINITION && node.name.value ? true : false
}

export function isSelectionDefinitionNode (node?: DefinitionNode) : node is FragmentDefinitionNode | OperationDefinitionNode
{
  return node?.kind == Kind.OPERATION_DEFINITION || node?.kind == Kind.FRAGMENT_DEFINITION
}

export function isIntoMatch(toTest: IntoMatchType | null | undefined) : toTest is WithRequiredProp<IntoMatchType, 'match'>
{
  if (!toTest)
    return false
  return toTest.match ? true : false
}

export function extractPluginConfigAndApplyDefaults(baseConfig: Record<string, unknown>, defaultValues: Partial<PluginOptions>) : Partial<PluginOptions>
{
  const extractedConfig : Partial<PluginOptions> = {
    clientPath: readAsNonEmptyString(baseConfig?.clientPath),
    functions: readAsNonEmptyStringArray(baseConfig?.functions),
    prettyPrintQuery: readAsBoolean(baseConfig?.prettyPrintQuery)
  }
  for (const propName of Object.getOwnPropertyNames(extractedConfig) as (keyof Partial<PluginOptions>)[])
    if (extractedConfig[propName] == null || extractedConfig[propName] == undefined)
      delete extractedConfig[propName]
    
  return {
    ...defaultValues,
    ...extractedConfig
  }
}

function readAsNonEmptyString(inputValue: unknown) : string | undefined
{
  return inputValue && typeof inputValue === 'string' && inputValue.length > 0 ? inputValue : undefined;
}

function readAsNonEmptyStringArray(inputValue: unknown) : string[] | undefined
{
  const list = Array.isArray(inputValue) ? inputValue.map(readAsNonEmptyString).filter(isNotNullOrUndefined) : undefined
  return (list?.length ?? 0) > 0 ? list : undefined
}

function readAsBoolean(inputValue: unknown) : boolean | undefined
{
  return inputValue && typeof inputValue === 'boolean' ? inputValue : undefined;
}