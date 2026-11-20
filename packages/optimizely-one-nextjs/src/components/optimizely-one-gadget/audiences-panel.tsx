'use client'
import { useEffect, type FunctionComponent } from 'react'
import { IconUsers as UserGroupIcon } from '@optiaxiom/icons'
import useSWRInfinite, {
  type SWRInfiniteKeyLoader,
  type SWRInfiniteConfiguration,
} from 'swr/infinite'
import type { ProfileApiResponse as MeResponse } from '../../api/profile-api-service'
import { Button, Text } from '@optiaxiom/react'
import Notice from './_notice'
import { ItemList, ListItem, PoweredBy } from './_ui'

export type AudiencesPanelProps = {
  servicePrefix?: string
  refreshInterval?: number
}

const buildGetKey: (
  servicePrefix: string,
  pageSize: number
) => SWRInfiniteKeyLoader<MeResponse> = (servicePrefix, pageSize) => {
  const serviceURL = `${servicePrefix}?scope=audiences&limit=${pageSize}`
  const getKey: SWRInfiniteKeyLoader<MeResponse> = (
    pageIndex,
    previousPageData
  ) => {
    if (previousPageData && previousPageData.rts.audiencesPageCount < pageIndex)
      return null
    return `${serviceURL}&page=${pageIndex}`
  }
  return getKey
}

export const AudiencesPanel: FunctionComponent<AudiencesPanelProps> = ({
  servicePrefix = '/api/me',
  refreshInterval = 0,
}) => {
  // Prepare data fetching
  const pageSize = 50
  const getKey = buildGetKey(servicePrefix, pageSize)
  const config: SWRInfiniteConfiguration<MeResponse> = {
    initialSize: 1,
    revalidateAll: true,
    revalidateOnMount: true,
    revalidateIfStale: true,
    refreshInterval: refreshInterval > 0 ? Math.max(refreshInterval, 10000) : 0, //Minimum refresh interval for audiences is 10 seconds
    fetcher: async (key) => {
      return fetch(key).then((r) => {
        if (!r.ok) throw new Error(`${r.status}: ${r.statusText}`)
        return r.json()
      })
    },
  }

  // Fetch results
  const {
    data: profiles,
    isLoading,
    isValidating,
    error,
    size,
    setSize,
  } = useSWRInfinite<MeResponse>(getKey, config)

  // Post-process the received values
  const audiencePages = !profiles ? 1 : profiles[0]?.rts.audiencesPageCount || 1
  const audienceCount = !profiles ? 0 : profiles[0]?.rts.audiencesCount || 0
  const hasMore = size < audiencePages

  // Automatically correct to the correct size, based upon the response
  useEffect(() => {
    const newSize = !profiles ? -1 : profiles[0]?.rts.audiencesPageCount || -1
    if (newSize >= 1 && size != newSize) setSize(newSize)
  }, [size, profiles])

  // Handle error
  if (error)
    return (
      <Notice message="There was an error loading your profile information" />
    )

  // Show list
  return (
    <>
      {hasMore && (
        <Notice
          prefix="Please note:"
          message={
            <>
              Showing results for the first {size * pageSize} audiences of{' '}
              {audienceCount},{' '}
              <Text
                asChild
                color="fg.link.default"
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
              >
                <span onClick={() => setSize(size + 1)}>load more</span>
              </Text>
            </>
          }
        />
      )}
      <ItemList>
        {(profiles || [])
          .map((profile) =>
            (profile?.rts.audiences ?? []).map((a) => {
              return (
                <ListItem
                  key={'audience-' + a.id}
                  icon={<UserGroupIcon size={16} />}
                >
                  {a.name}
                </ListItem>
              )
            })
          )
          .flat()}
      </ItemList>
      {hasMore && (
        <Button mt="8" size="sm" onClick={() => setSize(size + 1)}>
          Load more
        </Button>
      )}
      <PoweredBy>Powered by: Optimizely Data Platform</PoweredBy>
      {isLoading && <Notice isLoading message="Loading the audiences..." />}
      {isValidating && !isLoading && (
        <Notice isLoading message="Refreshing audiences" />
      )}
    </>
  )
}

export default AudiencesPanel
