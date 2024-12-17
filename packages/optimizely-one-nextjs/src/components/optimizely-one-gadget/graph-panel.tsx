import { type FunctionComponent } from 'react'
import useSWR from 'swr'
import type { GraphInfoApiResponse as ApiResponse } from '../../api/graph-info-service'
import Link from 'next/link'
import Notice from './_notice'

export type GraphPanelProps = {
    servicePrefix?: string
    refreshInterval?: number
}

export const GraphPanel : FunctionComponent<GraphPanelProps> = ({ servicePrefix = '/api/me', refreshInterval = 30000}) => 
{
    const id = `${ servicePrefix }/graph`
    const { data, isLoading, error } = useSWR<ApiResponse>(id, {
        revalidateOnMount: true,
        refreshInterval,
        fetcher: (key) => fetch(key).then(r => {
            if (!r.ok)
                throw new Error(`${ r.status }: ${ r.statusText}`)
            return r.json()
        })
    })

    if (isLoading)
        return <Notice isLoading message='Loading Optimizely Graph information...' />

    if (error)
        return <Notice message='There was an error loading Optimizely Graph information' />

    return <>
        <dl className='oo-definitions'>
            <dt className='oo-definitions-term'>Publishing changes to:</dt>
            <dd className='oo-definitions-data'>
                <ul className='oo-list'>
                    { (data?.hooks || []).map(hook => <li className='oo-list-item' key={`webhook-${ hook.url }`}>{ hook.method && <span className='oo-text-amber-800'>({ hook.method?.toLowerCase() ?? '' }) </span>}{ hook.url }{ hook.hasQueryParams && <>?...</>}</li>)} 
                </ul>
            </dd>
            <dt className='oo-definitions-term'>Exposing content from:</dt>
            <dd className='oo-definitions-data'>
                <ul className='oo-list'>
                    { (data?.sources || []).map(source => <li className='oo-list-item' key={`source-${ source.label}`}>{ updateLabel(source.label) }, available languages: { source.languages.join(", ")}</li>)}
                </ul>
            </dd>
        </dl>
        <p className='oo-pt-4 oo-text-[14px]'><Link className='oo-link' href="https://cg.optimizely.com/app/portal/" target='_new'>Login to Optimizely Graph</Link></p>
    </>
}

function updateLabel(label: string) 
{
    if (label == "default")
        return "Optimizely CMS"
    return label
}

export default GraphPanel