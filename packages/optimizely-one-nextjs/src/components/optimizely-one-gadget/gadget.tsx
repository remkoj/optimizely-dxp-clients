'use client'

import type { OptimizelyOneGadgetProps } from './_types'
import {
  useState,
  useMemo,
  useEffect,
  useLayoutEffect,
  type FunctionComponent,
  type ComponentType,
} from 'react'
import {
  AxiomProvider,
  Box,
  Button,
  Flex,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Text,
} from '@optiaxiom/react'
import { IconBolt, IconXmark } from '@optiaxiom/icons'
import dynamic from 'next/dynamic'
import type { SupportedProductNames } from '../types'
import { useOptimizelyOne } from '../context'
import { isLoggingEnabled } from '../../logger'
import OptimizelyLogo from './logo'
import { useDragScroll } from './_ui'
import { useOptimizelyTestCookie } from './_test-cookie'
import {
  CONTENT_CLASS,
  GADGET_CSS,
  TABS_CLASS,
  TRIGGER_CLASS,
  ensureAxiomLayerOrder,
} from './_styles'

/**
 * Session storage key under which the open/closed state of the gadget is kept,
 * so the gadget stays open across full page loads.
 */
const OPEN_STATE_KEY = 'opti-one-gadget-open'

type PanelList = Array<{
  id: string
  label: string
  Panel: ComponentType<{
    servicePrefix?: string
    refreshInterval?: number
    featureExperimentationProject?: string
  }>
  products: Array<SupportedProductNames>
}>

const Panels: PanelList = [
  {
    id: 'Profile',
    label: 'Profile',
    Panel: dynamic(() => import('./profile-panel'), { ssr: false }),
    products: ['dataPlatform'],
  },
  {
    id: 'Interests',
    label: 'Interests',
    Panel: dynamic(() => import('./interests-panel'), { ssr: false }),
    products: ['contentRecsClient', 'contentRecsApi'],
  },
  {
    id: 'Goals',
    label: 'Goals',
    Panel: dynamic(() => import('./goals-panel'), { ssr: false }),
    products: ['contentRecsClient', 'contentRecsApi'],
  },
  {
    id: 'Audiences',
    label: 'Audiences',
    Panel: dynamic(() => import('./audiences-panel'), { ssr: false }),
    products: ['dataPlatform'],
  },
  {
    id: 'Experiments',
    label: 'Experiments',
    Panel: dynamic(() => import('./exp-panel'), { ssr: false }),
    products: ['webExperimentation'],
  },
  {
    id: 'FeatureExperimentation',
    label: 'Feature Experimentation',
    Panel: dynamic(() => import('./feature-experimentation-panel'), {
      ssr: false,
    }),
    products: ['featureExperimentation'],
  },
  {
    id: 'Identifiers',
    label: 'Identifiers',
    Panel: dynamic(() => import('./ids-panel'), { ssr: false }),
    products: [],
  },
  {
    id: 'Graph',
    label: 'Graph',
    Panel: dynamic(() => import('./graph-panel'), { ssr: false }),
    products: [],
  },
]

/**
 * Add an Optimizely One Demo helper to the page.
 *
 * The gadget renders nothing until an Optimizely test cookie
 * (`optly_<domain name>_test`, with any value) is present in the browser, as
 * set by the bookmark or the Optimizely Web Experimentation browser
 * extension. Removing the cookie hides the gadget again. The cookie is
 * tracked fully client side, through Cookie Store change events when
 * supported and by polling every 500ms otherwise.
 *
 * Once opened, the gadget stays open (also across page navigations and
 * reloads within the browser session) until the close button is clicked;
 * pressing Escape also closes it, but clicking outside of it or clicking the
 * trigger again does not.
 *
 * @param       param0      The component properties
 * @returns     The component JSX
 */
export const OptimizelyOneGadget: FunctionComponent<
  OptimizelyOneGadgetProps
> = ({
  servicePrefix = '/api/me',
  refreshInterval = 0,
  featureExperimentationProject,
}) => {
  const { enabledOptimizelyProducts } = useOptimizelyOne()
  const testCookiePresent = useOptimizelyTestCookie()
  const tabs: PanelList = useMemo(() => {
    return Panels.filter(({ products }) => products.length === 0 || products.some(product => enabledOptimizelyProducts.includes(product)))
  }, [enabledOptimizelyProducts]);

  const [selectedTab, setSelectedTab] = useState('Identifiers');
  const dragScroll = useDragScroll<HTMLDivElement>()
  const [open, setOpenState] = useState(false)

  // The gadget is only closed explicitly, and the state survives navigations
  const setOpen = (newState: boolean) => {
    setOpenState(newState)
    try {
      if (newState) sessionStorage.setItem(OPEN_STATE_KEY, '1')
      else sessionStorage.removeItem(OPEN_STATE_KEY)
    } catch {
      // Storage not available, the state is kept in memory only
    }
  }

  useEffect(() => {
    try {
      if (sessionStorage.getItem(OPEN_STATE_KEY) === '1') setOpenState(true)
    } catch {
      // Storage not available
    }
  }, [])

  useLayoutEffect(() => {
    ensureAxiomLayerOrder()
  }, [])

  useEffect(() => {
    if (!isLoggingEnabled())
      return
    console.groupCollapsed(
      `🔎 [Optimizely One Gadget] Initializing Optimizely Demo Gadget`
    )
    console.log(`Optimizely One Demo API: ${servicePrefix}`)
    console.log(
      `Refresh interval: ${refreshInterval == 0 ? 'DISABLED' : refreshInterval + 'ms'}`
    )
    console.log(`Enabled products: ${enabledOptimizelyProducts.length === 0 ? 'NONE' : enabledOptimizelyProducts.join(', ')}`)
    console.groupEnd()
  },[servicePrefix, refreshInterval, enabledOptimizelyProducts])

  if (!testCookiePresent) return null

  return (
    <AxiomProvider>
      <style>{GADGET_CSS}</style>
      <Popover open={open} onOpenChange={() => {}}>
        <PopoverTrigger
          aria-label="Open the Optimizely One gadget"
          onClick={(e) => {
            e.preventDefault()
            setOpen(true)
          }}
          className={TRIGGER_CLASS}
          appearance="primary"
          icon={<IconBolt />}
          rounded="full"
          shadow="lg"
          size="lg"
          style={{
            position: 'fixed',
            right: '1.5rem',
            bottom: '1.5rem',
            zIndex: 2999,
            paddingInline: '1.5rem',
            gap: '0.625rem',
            border: '2px solid var(--ax-colors-bg-default)',
            boxShadow:
              '0 0 0 1px var(--ax-colors-border-default), 0 8px 20px rgba(0, 0, 0, 0.35)',
          }}
        >
          DXP
        </PopoverTrigger>
        <PopoverContent
          className={CONTENT_CLASS}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={() => setOpen(false)}
          side="top"
          align="end"
          sideOffset={12}
          p="0"
          shadow="xl"
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: 'min(30rem, calc(100vh - 6rem))',
            overflow: 'hidden',
          }}
        >
          <Flex
            flexDirection="row"
            alignItems="center"
            gap="8"
            px="16"
            py="10"
            borderB="1"
            borderColor="border.default"
            bg="bg.secondary"
            style={{ flex: 'none' }}
          >
            <OptimizelyLogo style={{ height: '1.5rem', width: 'auto' }} />
            <Text fontSize="sm" color="fg.secondary" style={{ flex: '1 1 auto' }}>
              Demo gadget
            </Text>
            <Button
              aria-label="Close the Optimizely One gadget"
              appearance="subtle"
              icon={<IconXmark />}
              size="sm"
              onClick={() => setOpen(false)}
            />
          </Flex>
          <Tabs
            value={selectedTab}
            onValueChange={setSelectedTab}
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: '1 1 0',
              minHeight: 0,
            }}
          >
            <TabsList
              {...dragScroll}
              className={TABS_CLASS}
              style={{
                flex: 'none',
                overflowX: 'auto',
                overflowY: 'hidden',
                flexWrap: 'nowrap',
                paddingInline: '1rem',
                scrollbarWidth: 'thin',
              }}
            >
              {tabs.map(({ id, label }) => (
                <TabsTrigger
                  key={`tab-${id}`}
                  value={id}
                  style={{ flex: 'none', whiteSpace: 'nowrap' }}
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map(({ id, Panel }) => (
              <TabsContent
                value={id}
                key={`tab-content-${id}`}
                style={{ flex: '1 1 0', minHeight: 0, overflowY: 'auto' }}
              >
                <Box p="16">
                  <Panel
                    refreshInterval={refreshInterval}
                    servicePrefix={servicePrefix}
                    featureExperimentationProject={
                      featureExperimentationProject
                    }
                  />
                </Box>
              </TabsContent>
            ))}
          </Tabs>
        </PopoverContent>
      </Popover>
    </AxiomProvider>
  )
}

export default OptimizelyOneGadget
