import type { OptimizelyOneGadgetProps } from '../components/optimizely-one-gadget/_types.js'
import getConfig, { checkProductStatus } from '../config.js'
import dynamic from 'next/dynamic'

const OptimizelyOneClientGadget = dynamic(() => import('../components/optimizely-one-gadget/gadget.js'), { ssr: false, loading: () => null })

/**
 * Server wrapper for the client-side Optimizely One debug gadget.
 *
 * The client component is only included in the page when the
 * `OPTIMIZELY_ONE_HELPER` environment variable is true. Once included, the
 * gadget stays hidden in the browser until an Optimizely test cookie
 * (`optly_<domain name>_test`) is present.
 *
 * @param props Gadget visibility and refresh configuration.
 * @returns The configured gadget when the helper is enabled, otherwise `null`.
 */
export const OptimizelyOneGadget = ({
  refreshInterval = 0,
  servicePrefix = '/api/me',
  showFeatureExperimentation,
}: OptimizelyOneGadgetProps) => {
  const optiOneConfig = getConfig()
  if (!optiOneConfig.HelperEnabled) return null
  const productStatus = checkProductStatus(optiOneConfig)

  return (
    <OptimizelyOneClientGadget
      refreshInterval={refreshInterval}
      servicePrefix={servicePrefix}
      showContentRecs={productStatus.contentRecsApi}
      showDataPlatform={productStatus.dataPlatform}
      showWebEx={productStatus.webExperimentation}
      showFeatureExperimentation={showFeatureExperimentation ?? productStatus.featureExperimentation}
      featureExperimentationProject={optiOneConfig.FeatureExperimentationProject}
    />
  )
}

export default OptimizelyOneGadget
