import { type FunctionComponent } from 'react'
import useSWR from 'swr'
import type { GraphInfoApiResponse as ApiResponse } from '../../api/graph-info-service'
import Link from 'next/link'
import Notice from './_notice'

export type GraphPanelProps = {
  servicePrefix?: string
  refreshInterval?: number
}

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
      <dl className="oo:grid oo:grid-cols-3 oo:gap-x-4 oo:gap-y-1">
        <dt className="oo:font-bold">Publishing changes to:</dt>
        <dd className="oo:col-span-2">
          <ul className="oo:grid oo:grid-cols-1 oo:divide-y oo:divide-slate-200">
            {(data?.hooks || []).map((hook) => (
              <li className="oo:py-1" key={`webhook-${hook.url}`}>
                {hook.method && (
                  <span className="oo:text-amber-800">
                    ({hook.method?.toLowerCase() ?? ''}){' '}
                  </span>
                )}
                {hook.url}
                {hook.hasQueryParams && <>?...</>}
              </li>
            ))}
          </ul>
        </dd>
        <dt className="oo:font-bold">Exposing content from:</dt>
        <dd className="oo:col-span-2">
          <ul className="oo:grid oo:grid-cols-1 oo:divide-y oo:divide-slate-200">
            {(data?.sources || []).map((source) => (
              <li className="oo:py-1" key={`source-${source.label}`}>
                {updateLabel(source.label)}, available languages:{' '}
                {source.languages.join(', ')}
              </li>
            ))}
          </ul>
        </dd>
      </dl>
      <p className="oo:pt-4 oo:text-[14px]">
        <Link
          className="oo:cursor-pointer oo:underline oo:text-blue-800"
          href="https://cg.optimizely.com/app/portal/"
          target="_new"
        >
          Login to Optimizely Graph
        </Link>
      </p>
    </>
  )
}

function updateLabel(label: string) {
  if (label == 'default') return 'Optimizely CMS'
  if (label == 'cmp') return 'Optimizely CMP'
  if (label == 'hub') return 'Optimizely Connect'
  return label
}

export default GraphPanel
