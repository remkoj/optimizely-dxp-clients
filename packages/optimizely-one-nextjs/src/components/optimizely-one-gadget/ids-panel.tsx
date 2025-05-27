'use client'
import { type FunctionComponent } from 'react'
import { usePathname } from 'next/navigation'
import useSWR from 'swr'
import { useOptimizelyOne } from '../context'
import type { ProfileApiResponse as MeResponse } from '../../api/profile-api-service'
import Notice from './_notice'

export type IdsPanelProps = {
  servicePrefix?: string
  refreshInterval?: number
}

export const IdsPanel: FunctionComponent<IdsPanelProps> = ({
  servicePrefix = '/api/me',
  refreshInterval = 2000,
}) => {
  const currentPath = usePathname()
  const opti = useOptimizelyOne()
  const webEx = opti.getService('webex')?.getBrowserApi()

  const ids = `${servicePrefix}?scope=ids`
  const {
    data: profile,
    isLoading,
    error,
  } = useSWR<MeResponse>(ids, {
    revalidateOnMount: true,
    refreshInterval,
    fetcher: () =>
      fetch(ids).then((r) => {
        if (!r.ok) throw new Error(`${r.status}: ${r.statusText}`)
        return r.json()
      }),
  })

  if (isLoading) return <Notice message="Loading your profile information..." />

  if (error)
    return (
      <Notice message="There was an error loading your profile information" />
    )

  return (
    <>
      <dl className="oo:grid oo:grid-cols-3 oo:gap-x-4 oo:gap-y-1">
        <dt className="oo:font-bold">Frontend (Feature Experimentation):</dt>
        <dd className="oo:col-span-2">{profile?.ids.frontend ?? 'n/a'}</dd>
        <dt className="oo:font-bold">Web Experimentation:</dt>
        <dd className="oo:col-span-2">
          {webEx && webEx.get ? webEx.get('visitor').visitorId : 'n/a'}
        </dd>
        <dt className="oo:font-bold">Content Intelligence:</dt>
        <dd className="oo:col-span-2">
          {profile?.ids.contentIntelligence ?? 'n/a'}
        </dd>
        <dt className="oo:font-bold">Data Platform:</dt>
        <dd className="oo:col-span-2">{profile?.ids.dataPlatform ?? 'n/a'}</dd>
        <dt className="oo:font-bold">Current path:</dt>
        <dd className="oo:col-span-2">{currentPath}</dd>
      </dl>
    </>
  )
}

export default IdsPanel
