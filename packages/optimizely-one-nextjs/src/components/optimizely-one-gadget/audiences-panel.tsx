import { useEffect, type FunctionComponent } from 'react'
import { UserGroupIcon } from '@heroicons/react/20/solid'
import useSWRInfinite, { type SWRInfiniteKeyLoader, type SWRInfiniteConfiguration } from 'swr/infinite'
import type { ProfileApiResponse as MeResponse } from '../../api/profile-api-service'
import Notice from './_notice'

export type AudiencesPanelProps = {
    servicePrefix?: string
    refreshInterval?: number
}

const buildGetKey : (servicePrefix: string, pageSize: number) => SWRInfiniteKeyLoader<MeResponse> = (servicePrefix, pageSize) => {
    const serviceURL = `${ servicePrefix }?scope=audiences&limit=${ pageSize }`
    const getKey : SWRInfiniteKeyLoader<MeResponse> = (pageIndex, previousPageData) => {
        if (previousPageData && previousPageData.rts.audiencesPageCount < pageIndex) return null
        return `${ serviceURL }&page=${ pageIndex }`
    }
    return getKey
}

export const AudiencesPanel : FunctionComponent<AudiencesPanelProps> = ({ servicePrefix = '/api/me', refreshInterval = 0}) => 
{
    // Prepare data fetching
    const pageSize = 50
    const getKey = buildGetKey(servicePrefix, pageSize)
    const config : SWRInfiniteConfiguration<MeResponse> = {
        initialSize: 1,
        revalidateAll: true,
        revalidateOnMount: true,
        revalidateIfStale: true,
        refreshInterval: refreshInterval > 0 ? Math.max(refreshInterval, 10000) : 0, //Minimum refresh interval for audiences is 10 seconds
        fetcher: async (key) => {
            return fetch(key).then(r => {
                if (!r.ok)
                    throw new Error(`${ r.status }: ${ r.statusText }`)
                return r.json()
            })
        },
    }

    // Fetch results
    const { data: profiles, isLoading, isValidating, error, size, setSize } = useSWRInfinite<MeResponse>(getKey, config)

    // Post-process the received values
    const audiencePages = !profiles ? 1 : (profiles[0]?.rts.audiencesPageCount || 1)
    const audienceCount = !profiles ? 0 : (profiles[0]?.rts.audiencesCount || 0)
    const hasMore = size < audiencePages

    // Automatically correct to the correct size, based upon the response
    useEffect(() => {
        let newSize = !profiles ? -1 : (profiles[0]?.rts.audiencesPageCount || -1)
        if (newSize >= 1 && size != newSize)
            setSize(newSize)
    }, [ size, profiles ])

    // Handle error
    if (error)
        return <Notice message='There was an error loading your profile information'/>

    // Show list
    return <>
        { hasMore && <Notice prefix='Please note:' message={<>Showing results for the first { size * pageSize } audiences of { audienceCount }, <span onClick={() => setSize(size + 1)} className="oo-link">load more</span></>} /> }
        <ul className='oo-list'>
            { (profiles || []).map(profile => (profile?.rts.audiences ?? []).map(a => {
                return <li className='oo-list-item' key={"audience-"+a.id}><UserGroupIcon className='oo-list-item-icon' />{ a.name }</li>
            })).flat() }
        </ul>
        <p className='oo-small'>Powered by: Optimizely Data Platform</p>
        { hasMore && <p onClick={() => setSize(size + 1)} className='oo-btn'>Load more</p>}
        { isLoading && <Notice isLoading message='Loading the audiences...'/> }
        { (isValidating && !isLoading) && <Notice isLoading message='Refreshing audiences'/> }
        <Notice prefix='Please note:' message='Interest based audiences are updated once per hour' />
    </>
}

export default AudiencesPanel