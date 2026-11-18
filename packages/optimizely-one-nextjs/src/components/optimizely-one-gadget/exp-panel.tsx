'use client'
import { useState, useEffect, type FunctionComponent } from 'react'
import { Link } from '@optiaxiom/react'
import { useOptimizelyOne } from '../context'
import type { OptlyWebGet } from '../../client-types'
import { ItemList, ListItem, PoweredBy, Section } from './_ui'

export const ExpPanel: FunctionComponent = () => {
  const opti = useOptimizelyOne()
  const webEx = opti.getService('webex')?.getBrowserApi()
  const data = webEx?.get ? webEx.get('data') : undefined
  const [pagesObject, setPagesObject] = useState<
    ReturnType<OptlyWebGet['state']['getPageStates']>
  >({})
  const [experimentStates, setExperimentStates] = useState<
    ReturnType<OptlyWebGet['state']['getExperimentStates']>
  >({})
  const [campaignStates, setCampaignStates] = useState<
    ReturnType<OptlyWebGet['state']['getCampaignStates']>
  >({})

  useEffect(() => {
    setPagesObject(
      webEx?.get ? webEx?.get('state').getPageStates({ isActive: true }) : {}
    )
    setExperimentStates(
      webEx?.get
        ? webEx?.get('state').getExperimentStates({ isActive: true })
        : {}
    )
    setCampaignStates(
      webEx?.get
        ? webEx?.get('state').getCampaignStates({ isActive: true })
        : {}
    )
    const intervalId = setInterval(() => {
      setPagesObject(
        webEx?.get ? webEx?.get('state').getPageStates({ isActive: true }) : {}
      )
      setExperimentStates(
        webEx?.get
          ? webEx?.get('state').getExperimentStates({ isActive: true })
          : {}
      )
      setCampaignStates(
        webEx?.get
          ? webEx?.get('state').getCampaignStates({ isActive: true })
          : {}
      )
    }, 2000)
    return () => clearInterval(intervalId)
  }, [webEx])

  // Process pages
  const pagesArray: (typeof pagesObject)[string][] = []
  for (const pageId of Object.getOwnPropertyNames(pagesObject))
    pagesArray.push(pagesObject[pageId])

  // Process experimentns
  const experimentsArray: (typeof experimentStates)[string][] = []
  for (const experimentId of Object.getOwnPropertyNames(experimentStates))
    experimentsArray.push(experimentStates[experimentId])

  // Process campaigns
  const campaignsArray: (typeof campaignStates)[string][] = []
  for (const campaignId of Object.getOwnPropertyNames(campaignStates))
    campaignsArray.push(campaignStates[campaignId])
  const filteredCampaigns = campaignsArray.filter((c) => {
    const expIds = experimentsArray.map((ed) => ed.id)
    return !expIds.includes(c.experiment.id)
  })

  const projectUrl = (path = '') =>
    `https://app.optimizely.com/v2/projects/${data?.projectId ?? ''}${path}`

  return (
    <>
      <Section title="Script information">
        Account id: {data?.accountId}; Project id:{' '}
        <Link href={projectUrl()} target="_blank">
          {data?.projectId}
        </Link>
        ; Revision: {data?.revision}
      </Section>
      <Section title="Active page(s)">
        <ItemList>
          {pagesArray.map((p) => (
            <ListItem key={`exp-page-${data?.projectId}-${p.id}`}>
              <Link
                href={projectUrl(`/implementation/pages/${p.id}`)}
                target="_blank"
              >
                {p.name || p.apiName}
              </Link>
            </ListItem>
          ))}
        </ItemList>
      </Section>
      <Section title="Active experiment(s)">
        <ItemList>
          {experimentsArray.map((e) => (
            <ListItem key={`exp-${data?.projectId}-${e.id}`}>
              <Link href={projectUrl(`/experiments/${e.id}`)} target="_blank">
                {e.experimentName || e.id}
              </Link>
              , variant:{' '}
              <Link
                href={projectUrl(
                  `/experiments/${e.id}/variations/${e.variation.id}`
                )}
                target="_blank"
              >
                {e.variation.name || e.variation.id}
              </Link>
            </ListItem>
          ))}
        </ItemList>
      </Section>
      <Section title="Active Personalization Campaigns(s)">
        <ItemList>
          {filteredCampaigns.map((e) => (
            <ListItem key={`campaign-${data?.projectId}-${e.id}`}>
              <Link href={projectUrl(`/campaigns/${e.id}`)} target="_blank">
                {e.campaignName || e.id}
              </Link>
              ; Audience(s):{' '}
              {e.audiences.map((a, idx) => (
                <span key={'exp-pers-aud-' + a.id}>
                  {idx > 0 && ', '}
                  <Link href={projectUrl(`/audiences/${a.id}`)} target="_blank">
                    {a.name}
                  </Link>
                </span>
              ))}
            </ListItem>
          ))}
        </ItemList>
      </Section>
      <PoweredBy>Powered by: Optimizely Web Experimentation</PoweredBy>
    </>
  )
}

export default ExpPanel
