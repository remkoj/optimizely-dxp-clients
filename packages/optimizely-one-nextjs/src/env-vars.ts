/**
 * Environment variable names consumed by the Optimizely One configuration.
 */
export const enum EnvVars {
  OdpApiKey = 'OPTIMIZELY_DATAPLATFORM_ID',
  OdpService = 'OPTIMIZELY_DATAPLATFORM_ENDPOINT',
  /** @deprecated Use `OdpService`; retained as a compatibility fallback. */
  OdpServiceLegacy = 'OPTIMIZLEY_DATAPLATFORM_ENDPOINT',
  OdpAudienceBatchSize = 'OPTIMIZELY_DATAPLATFORM_BATCH_SIZE',
  HelperEnabled = 'OPTIMIZELY_ONE_HELPER',
  ContentRecsClient = 'OPTIMIZELY_CONTENTRECS_CLIENT',
  ContentRecsDelivery = 'OPTIMIZELY_CONTENTRECS_DELIVERY',
  ContentRecsDeliveryKey = 'OPTIMIZELY_CONTENTRECS_DELIVERY_KEY',
  ContentRecsHost = 'OPTIMIZELY_CONTENTRECS_DOMAIN',
  FrontendCookie = 'OPTIMIZELY_FRONTEND_COOKIE',
  WebExperimentationProject = 'OPTIMIZELY_WEB_EXPERIMENTATION_PROJECT',
  FeatureExperimentationSdkKey = 'OPTIMIZELY_FX_SDKKEY',
  FeatureExperimentationProject = 'OPTIMIZELY_FX_PROJECT',
  FeatureExperimentationPat = 'OPTIMIZELY_FX_PAT',
  FeatureExperimentationProxy = 'OPTIMIZELY_FX_PROXY',
  FeatureExperimentationWebhookSecret = 'OPTIMIZELY_FX_WEBHOOK_SECRET',
  OptimizelyDebug = 'OPTIMIZELY_DEBUG'
}

export default EnvVars
