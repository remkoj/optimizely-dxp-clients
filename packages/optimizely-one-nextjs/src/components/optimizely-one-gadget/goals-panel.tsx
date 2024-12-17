import { type FunctionComponent } from 'react'
import { TrophyIcon, ArrowPathIcon } from '@heroicons/react/20/solid'
import useSWR from 'swr'
import { type GoalsReponse as ApiResponse } from '../../api/content-goals'
import Notice from './_notice'

export type GoalsPanelProps = {
    servicePrefix?: string
    refreshInterval?: number
}

export const GoalsPanel : FunctionComponent<GoalsPanelProps> = ({ servicePrefix = '/api/me', refreshInterval = 2000 }) => 
{
    const serviceUrl = `${ servicePrefix }/cgoals`
    const { data, isLoading, isValidating, error } = useSWR<ApiResponse>(serviceUrl, {
        revalidateOnMount: true,
        fetcher: () => fetch(serviceUrl).then(r => {
            if (!r.ok)
                throw new Error(`${ r.status }: ${ r.statusText }`)
            return r.json()
        }),
        refreshInterval
    })

    if (error)
        return <Notice>There was an error loading your next best goals</Notice>

    const goals : JSX.Element[] = (data?.goals ?? []).map(t => <li className='oo-list-item' key={"goal-"+t.goal}>
        <TrophyIcon className='oo-list-item-icon' />{ t.goal } ({ `${t.score * 100}%` })
    </li>)
    if (goals.length == 0)
        goals.push(<li className='oo-list-item' key="no-topics"><Notice>No goals inferred from behaviour</Notice></li>)

    return <>
        <ul className='oo-list'>{ goals }</ul>
        <p className='oo-small'>Powered by: Optimizely Content Recommendations</p>
        { (isValidating && !isLoading) && <Notice isLoading> Refreshing goals</Notice> }
        { isLoading && <Notice isLoading> Loading goals</Notice> }
    </>
}

export default GoalsPanel