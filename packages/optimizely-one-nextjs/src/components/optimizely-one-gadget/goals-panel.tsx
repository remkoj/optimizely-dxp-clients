import { type FunctionComponent } from 'react'
import { TrophyIcon, ArrowPathIcon } from '@heroicons/react/20/solid'
import useSWR from 'swr'
import { type GoalsReponse as ApiResponse } from '../../api/content-goals'

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
        return <p className='oo-m-2 md:oo-m-4 oo-rounded-md oo-bg-amber-200 oo-border oo-border-amber-800 oo-text-amber-800 oo-p-1 md:oo-p-2'>There was an error loading your next best goals</p>

    const goals : JSX.Element[] = (data?.goals ?? []).map(t => <li className='oo-py-1' key={"goal-"+t.goal}>
        <TrophyIcon className='oo-inline-block oo-h-[16px] oo-w-[16px] oo-mr-2' />{ t.goal } ({ `${t.score * 100}%` })
    </li>)
    if (goals.length == 0)
        goals.push(<li className='oo-py-1' key="no-topics"><div className="oo-m-2 md:oo-m-4 oo-rounded-md oo-bg-amber-200 oo-border oo-border-amber-800 oo-text-amber-800 oo-p-1 md:oo-p-2">No goals inferred from behaviour</div></li>)

    return <>
        <ul className='oo-text-[14px] oo-grid oo-grid-cols-1 oo-divide-y oo-divide-slate-200'>{ goals }</ul>
        <p className='oo-text-[12px]'>Powered by: Optimizely Content Recommendations</p>
        { (isValidating && !isLoading) && <p className='oo-text-[14px] oo-m-2 md:oo-m-4 oo-rounded-md oo-bg-amber-200 oo-border oo-border-amber-800 oo-text-amber-800 oo-p-1 md:oo-p-2'><ArrowPathIcon className='oo-inline-block oo-h-4 oo-w-4 oo-ml-2 oo-animate-spin' /> Refreshing goals</p> }
        { isLoading && <p className='oo-m-2 md:oo-m-4 oo-rounded-md oo-bg-amber-200 oo-border oo-border-amber-800 oo-text-amber-800 oo-p-1 md:oo-p-2'><ArrowPathIcon className='oo-inline-block oo-h-4 oo-w-4 oo-mr-2 oo-animate-spin' /> Loading goals</p> }
    </>
}

export default GoalsPanel