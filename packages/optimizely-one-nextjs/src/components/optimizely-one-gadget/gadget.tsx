'use client'
import type { OptimizelyOneGadgetProps } from './_types'
import { Fragment, useLayoutEffect, useCallback, type FunctionComponent, type ComponentType } from 'react'
import useCookie from '../use-cookie'
import { Popover, PopoverButton, PopoverPanel, Tab, TabGroup, TabList, TabPanels, TabPanel } from '@headlessui/react'
import { ChevronUpIcon, UserGroupIcon, TagIcon, RocketLaunchIcon, IdentificationIcon, Square3Stack3DIcon, TrophyIcon, FingerPrintIcon } from '@heroicons/react/20/solid'
import OptiLogo from './logo'
import { useIsInTestMode } from '../use-test-mode'
import { useSearchParams, usePathname } from 'next/navigation'

// Import the Panel CSS
import '../../styles.css'

// Prepare panel imports
import dynamic from 'next/dynamic'
const Panels : Array<{ 
    id: string, 
    Tab: ComponentType<{}>, 
    Panel: ComponentType<{ servicePrefix?: string, refreshInterval?: number }>, 
    products: Array<string> 
}> = [
    {
        id: 'Profile',
        Tab: () => <Tab as="div" className="oo-gadget-tab-label"><IdentificationIcon className='oo-gadget-tab-label-icon' />Profile</Tab>,
        Panel: dynamic(() => import('./profile-panel'), { ssr: false }),
        products: ['odp']
    },
    {
        id: 'Interests',
        Tab: () => <Tab as="div" className='oo-gadget-tab-label'><TagIcon className='oo-gadget-tab-label-icon' />Interests</Tab>,
        Panel: dynamic(() => import('./interests-panel'), { ssr: false }),
        products: ['crecs']
    },
    {
        id: 'Goals',
        Tab: () => <Tab as="div" className='oo-gadget-tab-label'><TrophyIcon className='oo-gadget-tab-label-icon' />Goals</Tab>,
        Panel: dynamic(() => import('./goals-panel'), { ssr: false}),
        products: ['crecs']
    },
    {
        id: 'Audiences',
        Tab: () => <Tab as="div" className='oo-gadget-tab-label'><UserGroupIcon className='oo-gadget-tab-label-icon' />Audiences</Tab>,
        Panel: dynamic(() => import('./audiences-panel'), { ssr: false }),
        products: ['odp']
    },
    {
        id: 'Experiments',
        Tab: () => <Tab as="div" className='oo-gadget-tab-label'><RocketLaunchIcon className='oo-gadget-tab-label-icon' />Experiments</Tab>,
        Panel: dynamic(() => import('./exp-panel'), { ssr: false }),
        products: ['webex']
    },
    {
        id: 'Identifiers',
        Tab: () => <Tab as="div" className='oo-gadget-tab-label'><FingerPrintIcon className='oo-gadget-tab-label-icon' />Identifiers</Tab>,
        Panel: dynamic(() => import('./ids-panel'), { ssr: false }),
        products: []
    },
    {
        id: 'Graph',
        Tab: () => <Tab as="div" className='oo-gadget-tab-label'><Square3Stack3DIcon className='oo-gadget-tab-label-icon' />Graph</Tab>,
        Panel: dynamic(() => import('./graph-panel'), { ssr: false }),
        products: []
    },
]

/**
 * Add an Optimizely One Demo helper to the page, which can be triggered by
 * the "test cookie" feature of the Optimizely Web Experimentation browser
 * extension.
 * 
 * @param       param0      The component properties
 * @returns     The component JSX
 */
export const OptimizelyOneGadget : FunctionComponent<OptimizelyOneGadgetProps> = ({ 
    servicePrefix = "/api/me", 
    refreshInterval = 0, 
    show = undefined, 
    showContentRecs = true, 
    showDataPlatform = true, 
    showWebEx = true
}) => {
    const inTestMode = useIsInTestMode();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const wxProjectIdParam = searchParams.get('pid');
    const [ projectIdCookie, setProjectIdCookie, removeProjectIdCookie ] = useCookie('wx.projectid');
    const enabledProducts : Array<string> = [];
    if (showContentRecs) enabledProducts.push('crecs');
    if (showDataPlatform) enabledProducts.push('odp');
    if (showWebEx) enabledProducts.push('webex')

    const removeQueryParam = useCallback((paramName: string) => {
        const newParams = new URLSearchParams(searchParams.toString())
        if (newParams.has(paramName))
            newParams.delete(paramName);
        const newSearch = newParams.toString()
        const newPath = pathname + (newSearch.length > 0 ? '?' + newParams.toString() : '')
        try {
            window.location.href = newPath
        } catch (e) {
            console.log("🛑 Refreshing the page to apply the new Web Experimenation project failed, please refresh manually.")
        }
    }, [ pathname, searchParams])

    useLayoutEffect(() => {
        if (wxProjectIdParam != null && wxProjectIdParam != projectIdCookie) {
            if (wxProjectIdParam == "")
                removeProjectIdCookie()
            else
                setProjectIdCookie(wxProjectIdParam)

            removeQueryParam('pid')
        }
    }, [ wxProjectIdParam, projectIdCookie, removeQueryParam, removeProjectIdCookie, setProjectIdCookie ])

    const forceHidden = show != undefined && show == false
    const forceShown = show != undefined && show == true

    if (forceHidden || (!forceShown && !inTestMode))
        return <></>
    
    console.groupCollapsed(`🔎 [Optimizely One Gadget] Initializing Optimizely Demo Gadget`)
    console.log(`Optimizely One Demo API: ${ servicePrefix }`)
    console.log(`Refresh interval: ${ refreshInterval == 0 ? 'DISABLED' : refreshInterval + 'ms' }`)
    console.log(`Enabled products: ${ enabledProducts.join(', ') }`)
    console.groupEnd()
    
    return <Popover className="oo-gadget">
        <PopoverButton className='oo-gadget-button'>
            <OptiLogo className='oo-gadget-button-logo' />
            <ChevronUpIcon className="oo-gadget-button-icon" />
        </PopoverButton>
        <PopoverPanel className="oo-gadget-panel">
            <div className="oo-gadget-panel-heading">
                <IdentificationIcon className='oo-gadget-panel-heading-icon' />My Profile
            </div>
            <TabGroup as={ Fragment }>
                <TabList className="oo-gadget-tab-list">
                    { Panels.filter(pnl => pnl.products.length == 0 || pnl.products.every(pk => enabledProducts.includes(pk))).map(({ id: pnlId, Tab: GadgetTab }) => {
                        const pnlTabKey = 'Tab-'+pnlId
                        return <GadgetTab key={pnlTabKey} />
                    }) }
                </TabList>
                <TabPanels className="oo-gadget-tab-container">
                    { Panels.filter(pnl => pnl.products.length == 0 || pnl.products.every(pk => enabledProducts.includes(pk))).map(({ id: pnlId, Panel: GadgetPanel }) => {
                        const pnlKey = 'Panel-'+pnlId
                        return <TabPanel key={pnlKey} as="div" className="oo-gadget-tab-panel">
                            <GadgetPanel servicePrefix={ servicePrefix } refreshInterval={ refreshInterval } />
                        </TabPanel>
                    }) }
                </TabPanels>
            </TabGroup>
        </PopoverPanel>
    </Popover>
}

export default OptimizelyOneGadget