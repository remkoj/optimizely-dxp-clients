'use client'
import { type FunctionComponent, type JSX } from 'react'
import { IconDollarSign as TrophyIcon } from '@optiaxiom/icons'
import useSWR from 'swr'
import { type GoalsReponse as ApiResponse } from '../../products/content-recs/webservice-goals'
import Notice from './_notice'
import { ItemList, ListItem, PoweredBy } from './_ui'

export type GoalsPanelProps = {
  servicePrefix?: string
  refreshInterval?: number
}

export const GoalsPanel: FunctionComponent<GoalsPanelProps> = ({
  servicePrefix = '/api/me',
  refreshInterval = 2000,
}) => {
  const serviceUrl = `${servicePrefix}/cgoals`
  const { data, isLoading, isValidating, error } = useSWR<ApiResponse>(
    serviceUrl,
    {
      revalidateOnMount: true,
      fetcher: () =>
        fetch(serviceUrl).then((r) => {
          if (!r.ok) throw new Error(`${r.status}: ${r.statusText}`)
          return r.json()
        }),
      refreshInterval,
    }
  )

  if (error)
    return <Notice>There was an error loading your next best goals</Notice>

  const goals: JSX.Element[] = (data?.goals ?? []).map((t) => (
    <ListItem
      key={'goal-' + t.goal}
      icon={<TrophyIcon size={16} />}
    >
      {t.goal} ({`${t.score * 100}%`})
    </ListItem>
  ))
  if (goals.length == 0)
    goals.push(
      <ListItem key="no-goals">
        <Notice>No goals inferred from behaviour</Notice>
      </ListItem>
    )

  return (
    <>
      <ItemList>{goals}</ItemList>
      <PoweredBy>Powered by: Optimizely Content Recommendations</PoweredBy>
      {isValidating && !isLoading && (
        <Notice isLoading> Refreshing goals</Notice>
      )}
      {isLoading && <Notice isLoading> Loading goals</Notice>}
    </>
  )
}

export default GoalsPanel
