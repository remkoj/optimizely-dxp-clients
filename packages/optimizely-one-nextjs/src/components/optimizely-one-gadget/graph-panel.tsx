'use client'
import { type FunctionComponent } from 'react'
import useSWR from 'swr'
import type { GraphInfoApiResponse as ApiResponse } from '../../api/graph-info-service'
import { Link, Text } from '@optiaxiom/react'
import Notice from './_notice'
import { DefinitionList, Term, Description, ItemList, ListItem } from './_ui'

const sourceLabels = new Map([
  ['default', 'Optimizely CMS'],
  ['cmp', 'Optimizely DAM'],
  ['cmpsc', 'Optimizely CMP'],
  ['hub', 'Optimizely Connect'],
  ['ocp', 'Optimizely Connect Platform']
])

/**
 * Options for the Optimizely Graph status panel.
 */
export type GraphPanelProps = {
  /** Prefix for the package API route. */
  servicePrefix?: string
  /** Poll interval in milliseconds; `0` disables periodic refresh. */
  refreshInterval?: number
}

/**
 * Displays Graph publishing hooks and the content sources available to Graph.
 *
 * @param props API route and refresh configuration.
 * @returns The Graph status panel.
 */
export const GraphPanel: FunctionComponent<GraphPanelProps> = ({
  servicePrefix = '/api/me',
  refreshInterval = 30000,
}) => {
  const id = `${servicePrefix}/graph`
  const { data, isLoading, error } = useSWR<ApiResponse>(id, {
    revalidateOnMount: true,
    refreshInterval,
    fetcher: (key) =>
      fetch(key).then((r) => {
        if (!r.ok) throw new Error(`${r.status}: ${r.statusText}`)
        return r.json()
      }),
  })

  if (isLoading)
    return (
      <Notice isLoading message="Loading Optimizely Graph information..." />
    )

  if (error)
    return (
      <Notice message="There was an error loading Optimizely Graph information" />
    )

  return (
    <>
      <DefinitionList>
        <Term>Publishing changes to</Term>
        <Description>
          <ItemList>
            {(data?.hooks || []).map((hook) => (
              <ListItem key={`webhook-${hook.url}`}>
                {hook.method && (
                  <Text asChild color="fg.warning">
                    <span>({hook.method?.toLowerCase() ?? ''}) </span>
                  </Text>
                )}
                {hook.url}
                {hook.hasQueryParams && <>?...</>}
              </ListItem>
            ))}
          </ItemList>
        </Description>
        <Term>Exposing content from</Term>
        <Description>
          <ItemList>
            {(data?.sources || []).map((source) => (
              <ListItem key={`source-${source.label}`}>
                {updateLabel(source.label)}, available languages:{' '}
                {source.languages.join(', ')}
              </ListItem>
            ))}
          </ItemList>
        </Description>
      </DefinitionList>
      <Text fontSize="sm" mt="12">
        <Link href="https://cg.optimizely.com/portal" target="_blank">
          Login to Optimizely Graph
        </Link>
      </Text>
    </>
  )
}

function updateLabel(label: string) {
  return sourceLabels.get(label.toLowerCase()) ?? label
}

export default GraphPanel
