'use client'

import { type FunctionComponent, type JSX } from 'react'
import { IconTag as TagIcon } from '@optiaxiom/icons'
import useSWR from 'swr'
import type { ProfileApiResponse as MeResponse } from '../../api/profile-api-service'
import Notice from './_notice'
import { ItemList, ListItem, PoweredBy } from './_ui'

export type InterestsPanelProps = {
  servicePrefix?: string
  refreshInterval?: number
}

export const InterestsPanel: FunctionComponent<InterestsPanelProps> = ({
  servicePrefix = '/api/me',
  refreshInterval = 2000,
}) => {
  const topics = `${servicePrefix}?scope=topics`
  const {
    data: profile,
    isLoading,
    isValidating,
    error,
  } = useSWR<MeResponse>(topics, {
    revalidateOnMount: true,
    fetcher: () =>
      fetch(topics).then((r) => {
        if (!r.ok) throw new Error(`${r.status}: ${r.statusText}`)
        return r.json()
      }),
    refreshInterval,
  })

  if (error)
    return <Notice>There was an error loading your profile information</Notice>

  const contentTopics: JSX.Element[] = (profile?.contentTopics ?? []).map(
    (t) => (
      <ListItem key={'topic-' + t} icon={<TagIcon size={16} />}>
        {t}
      </ListItem>
    )
  )
  if (contentTopics.length == 0)
    contentTopics.push(
      <ListItem key="no-topics">
        <Notice>No topics inferred from behaviour</Notice>
      </ListItem>
    )

  return (
    <>
      <ItemList>{contentTopics}</ItemList>
      <PoweredBy>Powered by: Optimizely Content Recommendations</PoweredBy>
      {isValidating && !isLoading && (
        <Notice isLoading> Refreshing interests</Notice>
      )}
      {isLoading && <Notice isLoading> Loading interests</Notice>}
    </>
  )
}

export default InterestsPanel
