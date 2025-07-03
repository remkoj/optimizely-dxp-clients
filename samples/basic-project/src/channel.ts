import ChannelRepository from '@remkoj/optimizely-graph-client/channels'

const cms_url = process.env.OPTIMIZELY_CMS_URL ?? 'https://example.cms.optimizely.com';

/**
 * The default channel definition for this deployment
 */
export const channel = ChannelRepository.createDefinition(
  "Basic Project",
  "http://localhost:3000",
  ["en", "en-US", "en-UK"],
  cms_url
);
export default channel;