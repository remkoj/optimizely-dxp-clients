import { type FunctionComponent } from 'react'
import { ArrowPathIcon, UserCircleIcon } from '@heroicons/react/20/solid'
import useSWR from 'swr'
import type { ProfileApiResponse as MeResponse } from '../../api/profile-api-service'
import Notice from './_notice'

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
    return (
      <Notice message="There was an error loading your profile information" />
    )

  return (
    <>
      {profile && !profile.profile && <Notice message="Anonymous session" />}
      {profile && profile.profile && (
        <div className="oo:w-full oo:flex oo:flex-row oo:gap-4 oo:mb-2">
          <div className="oo:flex-none oo:w-[100px]">
            {profile.profile.image_url ? (
              <img
                src={profile.profile.image_url}
                alt={profile.profile.name ?? ''}
                className="oo:w-full oo:aspect-square oo:rounded-[15px]"
              />
            ) : (
              <UserCircleIcon className="oo:w-full oo:aspect-square oo:rounded-[15px]" />
            )}
          </div>
          <div className="oo:flex-grow">
            <dl className="oo:grid oo:grid-cols-3 oo:gap-x-4 oo:gap-y-1">
              <dt className="oo:font-bold">Name:</dt>
              <dd className="oo:col-span-2">
                {profile.profile.name
                  ? profile.profile.name
                  : `${profile.profile.first_name ?? ''} ${profile.profile.last_name}`.trim()}
              </dd>
              <dt className="oo:font-bold">City:</dt>
              <dd className="oo:col-span-2">{profile.profile.city ?? ''}</dd>
              <dt className="oo:font-bold">E-Mail:</dt>
              <dd className="oo:col-span-2">{profile.profile.email ?? ''}</dd>
              <dt className="oo:font-bold">Phone:</dt>
              <dd className="oo:col-span-2">{profile.profile.phone ?? ''}</dd>
              <dt className="oo:font-bold">Age:</dt>
              <dd className="oo:col-span-2">
                {profile.profile.observations.computed_age_years ?? 'n/a'}
              </dd>
              <dt className="oo:font-bold">Number of visits:</dt>
              <dd className="oo:col-span-2">
                {profile.profile.observations.session_count}
              </dd>
              <dt className="oo:font-bold">Likelyhood of still alive:</dt>
              <dd className="oo:col-span-2">{`${(profile.profile.insights.probability_alive ?? 0) * 100}%`}</dd>
            </dl>
            <pre className="oo:hidden">
              {JSON.stringify(profile.profile, undefined, 4)}
            </pre>
          </div>
        </div>
      )}
      <p className="oo:text-[12px]">Powered by: Optimizely Data Platform</p>
      {isLoading && <Notice isLoading message="Loading profile" />}
    </>
  )
}

export default ProfilePanel
