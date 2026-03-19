import type { OptimizelyOneGadgetProps } from './_types'
import getConfig, { checkProductStatus } from '../../config'
import dynamic from 'next/dynamic'

import 'server-only'

const OptimizelyOneClientGadget = dynamic(() => import('./gadget'), { ssr: false, loading: () => null })

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
      <OptimizelyOneClientGadget
        refreshInterval={refreshInterval}
        servicePrefix={servicePrefix}
        show={show}
        showContentRecs={productStatus.contentRecsApi}
        showDataPlatform={productStatus.dataPlatform}
        showWebEx={productStatus.webExperimentation}
      />
    )
  }

  if (OptimizelyDebug)
    console.log(
      `🚀 [OptimizelyOne Gadget] Gadget disabled by ${show === undefined ? 'configuration' : 'parameter'}`
    )
  return null
}

export default OptimizelyOneGadget
