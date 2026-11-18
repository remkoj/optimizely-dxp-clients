
/**
 * Properties accepted by the Optimizely One debug gadget.
 */
export type OptimizelyOneGadgetProps = {
  /**
     * The API Route at which the companion API has been installed in your
     * Next.JS Application.
     * 
     * If not set, defaults to "/api/me"
     */
  servicePrefix?: string

  /**
     * The interval, in milliseconds, between refreshes of the content in the
     * debug panels.
     * 
     * If not set, defaults to 0 (no auto refresh)
     */
  refreshInterval?: number

  showDataPlatform?: boolean
  showContentRecs?: boolean
  showWebEx?: boolean
  /** Enables the Feature Experimentation decisions panel. */
  showFeatureExperimentation?: boolean
  /** Feature Experimentation project ID to display in the gadget. */
  featureExperimentationProject?: string
}
