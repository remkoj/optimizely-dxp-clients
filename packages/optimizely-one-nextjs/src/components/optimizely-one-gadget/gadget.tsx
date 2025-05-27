'use client'
import type { OptimizelyOneGadgetProps } from './_types'
import {
  Fragment,
  useLayoutEffect,
  useCallback,
  type FunctionComponent,
  type ComponentType,
} from 'react'
import useCookie from '../use-cookie'
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Tab,
  TabGroup,
  TabList,
  TabPanels,
  TabPanel,
} from '@headlessui/react'
import {
  ChevronUpIcon,
  UserGroupIcon,
  TagIcon,
  RocketLaunchIcon,
  IdentificationIcon,
  Square3Stack3DIcon,
  TrophyIcon,
  FingerPrintIcon,
} from '@heroicons/react/20/solid'
import OptiLogo from './logo'
import { useIsInTestMode } from '../use-test-mode'
import { useSearchParams, usePathname } from 'next/navigation'

// Import the Panel CSS
import '../../styles.css'

// Prepare panel imports
import dynamic from 'next/dynamic'
const Panels: Array<{
  id: string
  Tab: ComponentType<{}>
  Panel: ComponentType<{ servicePrefix?: string; refreshInterval?: number }>
  products: Array<string>
}> = [
  {
    id: 'Profile',
    Tab: () => (
      <Tab
        as="div"
        className="oo:text-center oo:inline-block oo:cursor-pointer oo:px-2 oo:py-1 oo:border oo:border-b-0  oo:border-slate-300 oo:rounded-t-md oo:data-selected:bg-blue-500 oo:data-selected:text-white"
      >
        <IdentificationIcon className="oo:inline-block oo:h-[1.25em] oo:w-[1.25em] oo:mr-[0.25em]" />
        Profile
      </Tab>
    ),
    Panel: dynamic(() => import('./profile-panel'), { ssr: false }),
    products: ['odp'],
  },
  {
    id: 'Interests',
    Tab: () => (
      <Tab
        as="div"
        className="oo:text-center oo:inline-block oo:cursor-pointer oo:px-2 oo:py-1 oo:border oo:border-b-0  oo:border-slate-300 oo:rounded-t-md oo:data-selected:bg-blue-500 oo:data-selected:text-white"
      >
        <TagIcon className="oo:inline-block oo:h-[1.25em] oo:w-[1.25em] oo:mr-[0.25em]" />
        Interests
      </Tab>
    ),
    Panel: dynamic(() => import('./interests-panel'), { ssr: false }),
    products: ['crecs'],
  },
  {
    id: 'Goals',
    Tab: () => (
      <Tab
        as="div"
        className="oo:text-center oo:inline-block oo:cursor-pointer oo:px-2 oo:py-1 oo:border oo:border-b-0  oo:border-slate-300 oo:rounded-t-md oo:data-selected:bg-blue-500 oo:data-selected:text-white"
      >
        <TrophyIcon className="oo:inline-block oo:h-[1.25em] oo:w-[1.25em] oo:mr-[0.25em]" />
        Goals
      </Tab>
    ),
    Panel: dynamic(() => import('./goals-panel'), { ssr: false }),
    products: ['crecs'],
  },
  {
    id: 'Audiences',
    Tab: () => (
      <Tab
        as="div"
        className="oo:text-center oo:inline-block oo:cursor-pointer oo:px-2 oo:py-1 oo:border oo:border-b-0  oo:border-slate-300 oo:rounded-t-md oo:data-selected:bg-blue-500 oo:data-selected:text-white"
      >
        <UserGroupIcon className="oo:inline-block oo:h-[1.25em] oo:w-[1.25em] oo:mr-[0.25em]" />
        Audiences
      </Tab>
    ),
    Panel: dynamic(() => import('./audiences-panel'), { ssr: false }),
    products: ['odp'],
  },
  {
    id: 'Experiments',
    Tab: () => (
      <Tab
        as="div"
        className="oo:text-center oo:inline-block oo:cursor-pointer oo:px-2 oo:py-1 oo:border oo:border-b-0  oo:border-slate-300 oo:rounded-t-md oo:data-selected:bg-blue-500 oo:data-selected:text-white"
      >
        <RocketLaunchIcon className="oo:inline-block oo:h-[1.25em] oo:w-[1.25em] oo:mr-[0.25em]" />
        Experiments
      </Tab>
    ),
    Panel: dynamic(() => import('./exp-panel'), { ssr: false }),
    products: ['webex'],
  },
  {
    id: 'Identifiers',
    Tab: () => (
      <Tab
        as="div"
        className="oo:text-center oo:inline-block oo:cursor-pointer oo:px-2 oo:py-1 oo:border oo:border-b-0  oo:border-slate-300 oo:rounded-t-md oo:data-selected:bg-blue-500 oo:data-selected:text-white"
      >
        <FingerPrintIcon className="oo:inline-block oo:h-[1.25em] oo:w-[1.25em] oo:mr-[0.25em]" />
        Identifiers
      </Tab>
    ),
    Panel: dynamic(() => import('./ids-panel'), { ssr: false }),
    products: [],
  },
  {
    id: 'Graph',
    Tab: () => (
      <Tab
        as="div"
        className="oo:text-center oo:inline-block oo:cursor-pointer oo:px-2 oo:py-1 oo:border oo:border-b-0  oo:border-slate-300 oo:rounded-t-md oo:data-selected:bg-blue-500 oo:data-selected:text-white"
      >
        <Square3Stack3DIcon className="oo:inline-block oo:h-[1.25em] oo:w-[1.25em] oo:mr-[0.25em]" />
        Graph
      </Tab>
    ),
    Panel: dynamic(() => import('./graph-panel'), { ssr: false }),
    products: [],
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
export const OptimizelyOneGadget: FunctionComponent<
  OptimizelyOneGadgetProps
> = ({
  servicePrefix = '/api/me',
  refreshInterval = 0,
  show = undefined,
  showContentRecs = true,
  showDataPlatform = true,
  showWebEx = true,
}) => {
  const inTestMode = useIsInTestMode()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const wxProjectIdParam = searchParams.get('pid')
  const [projectIdCookie, setProjectIdCookie, removeProjectIdCookie] =
    useCookie('wx.projectid')
  const enabledProducts: Array<string> = []
  if (showContentRecs) enabledProducts.push('crecs')
  if (showDataPlatform) enabledProducts.push('odp')
  if (showWebEx) enabledProducts.push('webex')

  const removeQueryParam = useCallback(
    (paramName: string) => {
      const newParams = new URLSearchParams(searchParams.toString())
      if (newParams.has(paramName)) newParams.delete(paramName)
      const newSearch = newParams.toString()
      const newPath =
        pathname + (newSearch.length > 0 ? '?' + newParams.toString() : '')
      try {
        window.location.href = newPath
      } catch (e) {
        console.log(
          '🛑 Refreshing the page to apply the new Web Experimenation project failed, please refresh manually.'
        )
      }
    },
    [pathname, searchParams]
  )

  useLayoutEffect(() => {
    if (wxProjectIdParam != null && wxProjectIdParam != projectIdCookie) {
      if (wxProjectIdParam == '') removeProjectIdCookie()
      else setProjectIdCookie(wxProjectIdParam)

      removeQueryParam('pid')
    }
  }, [
    wxProjectIdParam,
    projectIdCookie,
    removeQueryParam,
    removeProjectIdCookie,
    setProjectIdCookie,
  ])

  const forceHidden = show != undefined && show == false
  const forceShown = show != undefined && show == true

  if (forceHidden || (!forceShown && !inTestMode)) return <></>

  console.groupCollapsed(
    `🔎 [Optimizely One Gadget] Initializing Optimizely Demo Gadget`
  )
  console.log(`Optimizely One Demo API: ${servicePrefix}`)
  console.log(
    `Refresh interval: ${refreshInterval == 0 ? 'DISABLED' : refreshInterval + 'ms'}`
  )
  console.log(`Enabled products: ${enabledProducts.join(', ')}`)
  console.groupEnd()

  return (
    <Popover className="oo:md:fixed oo:md:bottom-0 oo:z-[500]">
      <PopoverButton className="oo:fixed oo:bottom-0 oo:right-0 oo:w-full oo:h-[50px] oo:flex oo:flex-row oo:justify-between oo:border-t oo:border-slate-500 oo:bg-slate-100 oo:text-slate-800 oo:md:w-[350px] oo:md:right-4 oo:md:rounded-t-md oo:md:border-x oo:z-[500] oo:p-[10px] oo:dark:text-slate-800">
        <OptiLogo className="oo:w-auto oo:h-full" />
        <ChevronUpIcon className="oo:data-open:rotate-180 oo:data-open:transform oo:h-full oo:w-auto oo:inline-block" />
      </PopoverButton>
      <PopoverPanel className="oo:text-[14px] oo:fixed oo:bottom-[50px] oo:right-0 oo:w-full oo:top-0 oo:md:border oo:md:border-slate-300 oo:bg-white oo:md:right-4 oo:md:bottom-[55px] oo:md:w-[800px] oo:z-[501] oo:max-w-full oo:flex oo:flex-col oo:justify-stretch oo:md:h-[350px] oo:md:top-auto oo:md:rounded-md oo:md:shadow-xl oo:md:overflow-hidden oo:text-slate-800 oo:dark:text-slate-800">
        <div className="oo:text-[18px] oo:border-b oo:border-slate-300 oo:bg-slate-100 oo:text-slate-800 oo:font-bold oo:p-1 oo:flex-none oo:md:p-2">
          <IdentificationIcon className="oo:inline-block oo:h-[1.5em] oo:w-[1.5em] oo:mr-[0.5em] oo:text-blue-500" />
          My Profile
        </div>
        <TabGroup as={Fragment}>
          <TabList className="oo:flex-none oo:flex oo:justify-between oo:md:justify-start oo:gap-[0.25em] oo:px-[0.25em] oo:pt-[0.5em] oo:border-b oo:border-slate-300">
            {Panels.filter(
              (pnl) =>
                pnl.products.length == 0 ||
                pnl.products.every((pk) => enabledProducts.includes(pk))
            ).map(({ id: pnlId, Tab: GadgetTab }) => {
              const pnlTabKey = 'Tab-' + pnlId
              return <GadgetTab key={pnlTabKey} />
            })}
          </TabList>
          <TabPanels className="oo:flex-1 oo:md:h-24 oo:overscroll-contain oo:overflow-y-auto">
            {Panels.filter(
              (pnl) =>
                pnl.products.length == 0 ||
                pnl.products.every((pk) => enabledProducts.includes(pk))
            ).map(({ id: pnlId, Panel: GadgetPanel }) => {
              const pnlKey = 'Panel-' + pnlId
              return (
                <TabPanel key={pnlKey} as="div" className="oo:p-1 oo:md:p-2">
                  <GadgetPanel
                    servicePrefix={servicePrefix}
                    refreshInterval={refreshInterval}
                  />
                </TabPanel>
              )
            })}
          </TabPanels>
        </TabGroup>
      </PopoverPanel>
    </Popover>
  )
}

export default OptimizelyOneGadget
