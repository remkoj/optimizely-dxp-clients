import type { OptimizelyOneGadgetProps } from './_types'
import getConfig, { checkProductStatus } from '../../config'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import 'server-only'

const OptimizelyOneClientGadget = dynamic(() => import('./gadget'), { ssr: false })

export const OptimizelyOneGadget = ({
  refreshInterval = 0,
  servicePrefix = '/api/me',
  show,
}: OptimizelyOneGadgetProps) => {
  const optiOneConfig = getConfig()
  const { HelperEnabled, OptimizelyDebug } = optiOneConfig
  const productStatus = checkProductStatus(optiOneConfig)

  if (show || (show === undefined && HelperEnabled)) {
    return (
      <Suspense fallback={null}>
        <OptimizelyOneClientGadget
          refreshInterval={refreshInterval}
          servicePrefix={servicePrefix}
          show={show}
          showContentRecs={productStatus.contentRecsApi}
          showDataPlatform={productStatus.dataPlatform}
          showWebEx={productStatus.webExperimentation}
        />
      </Suspense>
    )
  }

  if (OptimizelyDebug)
    console.log(
      `🚀 [OptimizelyOne Gadget] Gadget disabled by ${show === undefined ? 'configuration' : 'parameter'}`
    )
  return null
}

export default OptimizelyOneGadget
