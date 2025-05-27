import { type FunctionComponent, type JSX } from 'react'
import { TagIcon } from '@heroicons/react/20/solid'
import useSWR from 'swr'
import type { ProfileApiResponse as MeResponse } from '../../api/profile-api-service'
import Notice from './_notice'

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
      <li className="oo:py-1" key={'topic-' + t}>
        <TagIcon className="oo:inline-block oo:h-4 oo:w-4 oo:mr-2" />
        {t}
      </li>
    )
  )
  if (contentTopics.length == 0)
    contentTopics.push(
      <li className="oo:py-1" key="no-topics">
        <Notice>No topics inferred from behaviour</Notice>
      </li>
    )

  return (
    <>
      <ul className="oo:grid oo:grid-cols-1 oo:divide-y oo:divide-slate-200">
        {contentTopics}
      </ul>
      <p className="oo:text-[12px]">
        Powered by: Optimizely Content Recommendations
      </p>
      {isValidating && !isLoading && (
        <Notice isLoading> Refreshing interests</Notice>
      )}
      {isLoading && <Notice isLoading> Loading interests</Notice>}
    </>
  )
}

export default InterestsPanel
