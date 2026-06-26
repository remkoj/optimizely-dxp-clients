'use client'
import * as FX from '@optimizely/react-sdk';
import { useMemo, useEffect, type PropsWithChildren } from 'react';
import { useCookie } from '../../components/use-cookie.js';

export type FeatureExperimentationProviderProps = PropsWithChildren<{
  sdkKey: string,
  frontendCookie: string
  debug?: boolean
}>

export default function FeatureExperimentationProvider({ sdkKey, frontendCookie, debug = false, children }: FeatureExperimentationProviderProps) {
  const optimizelyClient = useMemo(() => FX.createInstance({
    projectConfigManager: FX.createPollingProjectConfigManager({
      sdkKey,
      autoUpdate: true,
      updateInterval: 1000 * 60, // Update every minute
    }),
    eventProcessor: FX.createBatchEventProcessor({
      batchSize: 10, // Send events in batches of 10 (or when flush interval is reached)
      flushInterval: 1000 * 30, // Flush every 30 seconds
    }),
    odpManager: FX.createOdpManager({
      eventBatchSize: 10,
      eventFlushInterval: 1000 * 30,
    }),
    vuidManager: FX.createVuidManager({
      enableVuid: true,
      // vuidCache: 
    })
  }), [sdkKey, debug]);

  const [userId] = useCookie(frontendCookie, `optimizely-one-user-${Math.random().toString(36).substring(2, 15)}`);

  useEffect(() => {
    if (debug || process.env.NODE_ENV === 'development') {
      console.groupCollapsed('🔧 [FeatureExperimentationProvider] Debug mode enabled');
      console.log('🔑 SDK Key:', sdkKey);
      console.log('🍪 Frontend Cookie:', frontendCookie);
      console.log('👤 User ID:', userId);
      console.groupEnd();
    }
  }, [sdkKey, frontendCookie, userId, debug]);

  return (
    <FX.OptimizelyProvider client={optimizelyClient} user={{ id: userId }}>
      {children}
    </FX.OptimizelyProvider>
  );
}
