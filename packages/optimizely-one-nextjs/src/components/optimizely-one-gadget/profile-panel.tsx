'use client'
import { type FunctionComponent } from 'react'
//import { UserCircleIcon } from '@heroicons/react/20/solid'
import { IconCircleUser as UserCircleIcon } from '@optiaxiom/icons'
import useSWR from 'swr'
import type { ProfileApiResponse as MeResponse } from '../../api/profile-api-service'
import { Box, Flex } from '@optiaxiom/react'
import Notice from './_notice'
import { DefinitionList, Term, Description, PoweredBy } from './_ui'

export type ProfilePanelProps = {
  servicePrefix?: string
  refreshInterval?: number
}

export const ProfilePanel: FunctionComponent<ProfilePanelProps> = ({
  servicePrefix = '/api/me',
  refreshInterval = 2000,
}) => {
  const topics = `${servicePrefix}?scope=profile`
  const {
    data: profile,
    isLoading,
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
    return (
      <Notice message="There was an error loading your profile information" />
    )

  return (
    <>
      {profile && !profile.profile && (
        <Notice
          message={
            profile.profileState === 'unknown' && profile.ids.dataPlatform !== 'n/a'
              ? `No profile found for visitor ${profile.ids.dataPlatform}`
              : 'Anonymous session'
          }
        />
      )}
      {profile && profile.profile && (
        <Flex flexDirection="row" gap="16" mb="8">
          <Box style={{ flex: 'none', width: '4.5rem' }}>
            {profile.profile.image_url ? (
              <img
                src={profile.profile.image_url}
                alt={profile.profile.name ?? ''}
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  objectFit: 'cover',
                  borderRadius: '0.75rem',
                }}
              />
            ) : (
              <Box color="fg.tertiary">
                <UserCircleIcon size="100%" />
              </Box>
            )}
          </Box>
          <Box style={{ flex: '1 1 0', minWidth: 0 }}>
            <DefinitionList>
              <Term>Name</Term>
              <Description>
                {profile.profile.name
                  ? profile.profile.name
                  : `${profile.profile.first_name ?? ''} ${profile.profile.last_name ?? ''}`.trim()}
              </Description>
              <Term>City</Term>
              <Description>{profile.profile.city ?? ''}</Description>
              <Term>E-Mail</Term>
              <Description>{profile.profile.email ?? ''}</Description>
              <Term>Phone</Term>
              <Description>{profile.profile.phone ?? ''}</Description>
              <Term>Age</Term>
              <Description>
                {profile.profile.observations?.computed_age_years ?? 'n/a'}
              </Description>
              <Term>Number of visits</Term>
              <Description>
                {profile.profile.observations?.session_count ?? 'n/a'}
              </Description>
              <Term>Likelyhood of still alive</Term>
              <Description>
                {profile.profile.insights?.probability_alive != null
                  ? `${profile.profile.insights.probability_alive * 100}%`
                  : 'n/a'}
              </Description>
            </DefinitionList>
          </Box>
        </Flex>
      )}
      <PoweredBy>Powered by: Optimizely Data Platform</PoweredBy>
      {isLoading && <Notice isLoading message="Loading profile" />}
    </>
  )
}

export default ProfilePanel
