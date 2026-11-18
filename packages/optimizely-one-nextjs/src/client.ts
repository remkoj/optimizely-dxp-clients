/**
 * Types shared by Optimizely One client-side services.
 */
export type * from './products/client-types' // Client side types

/**
 * Product client APIs that can run in browser environments.
 */
export * from './products' // Product libraries work across client & server

/**
 * Optimizely One provider, context hooks, and gadget components.
 */
export * from './components' // Client component hooks

/**
 * Feature Experimentation decisions from the configured SDK provider.
 */
export {
  useDecide,
  useDecideForKeys,
  useDecideAll,
  useDecideAsync,
  useDecideForKeysAsync,
  useDecideAllAsync
} from '@optimizely/react-sdk'

/**
 * Decision options and result types for the Feature Experimentation hooks,
 * re-exported so consumers don't need a direct dependency on the SDK.
 */
export { OptimizelyDecideOption } from '@optimizely/react-sdk'
export type { OptimizelyDecision, OptimizelyUserContext } from '@optimizely/react-sdk'

/**
 * Shared visitor model and client-side decision methods for Feature
 * Experimentation, the counterpart of the methods in
 * `@remkoj/optimizely-one-nextjs/feature-experimentation/server`.
 */
export { useFeatureExperimentation, useFeatureExperimentationUser, ResolveFeatureExperimentationAttributes } from './products/feature-experimentation/provider'
export type {
  FeatureExperimentationUser,
  FeatureExperimentationAttributes,
  FeatureExperimentationAttributesResolver,
  FeatureExperimentationDecision,
  FeatureExperimentationDecideOptions,
  FeatureExperimentationSegmentOption
} from './products/feature-experimentation'

// Content Recs
/**
 * Content Recommendations component for rendering personalized delivery items.
 */
export { ContentRecsDelivery } from './products/content-recs/delivery'

/**
 * Props accepted by `ContentRecsDelivery`.
 */
export type { ContentRecsDeliveryProps } from './products/content-recs/delivery'