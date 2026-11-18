'use client'
import { type FunctionComponent } from 'react'
import { usePathname } from 'next/navigation'
import useSWR from 'swr'
import { useOptimizelyOne } from '../context'
import type { ProfileApiResponse as MeResponse } from '../../api/profile-api-service'
import Notice from './_notice'
import { DefinitionList, Term, Description } from './_ui'

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
  // Mirrors the condition under which the gadget shows the Feature Experimentation tab
  const showFx = opti.enabledOptimizelyProducts.includes('featureExperimentation')

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
    <DefinitionList>
      <Term>{showFx ? 'Frontend (Feature Experimentation)' : 'Frontend'}</Term>
      <Description>{profile?.ids.frontend ?? 'n/a'}</Description>
      <Term>Web Experimentation</Term>
      <Description>
        {webEx && webEx.get ? webEx.get('visitor').visitorId : 'n/a'}
      </Description>
      <Term>Content Intelligence</Term>
      <Description>{profile?.ids.contentIntelligence ?? 'n/a'}</Description>
      <Term>Data Platform</Term>
      <Description>{profile?.ids.dataPlatform ?? 'n/a'}</Description>
      <Term>Current path</Term>
      <Description>{currentPath}</Description>
    </DefinitionList>
  )
}

export default IdsPanel
