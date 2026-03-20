'use client'

import { createInstance, OptimizelyProvider } from '@optimizely/react-sdk';
import { useMemo, useEffect, type PropsWithChildren } from 'react';
import { useCookie } from '../../components/use-cookie.js';

export type FeatureExperimentationProviderProps = PropsWithChildren<{
  sdkKey: string,
  frontendCookie: string
  debug?: boolean
}>

export default function FeatureExperimentationProvider({ sdkKey, frontendCookie, debug = false, children }: FeatureExperimentationProviderProps) {
  const optimizelyClient = useMemo(() => createInstance({
    sdkKey,
    datafileOptions: {
      autoUpdate: true,
      updateInterval: 1000 * 60, // Update every minute
    },
    eventBatchSize: 10,
    eventFlushInterval: 1000 * 30, // Flush every 30 seconds
    logLevel: debug ? 'debug' : 'error',
    odpOptions: {
      disabled: false
    }
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
    <OptimizelyProvider optimizely={optimizelyClient} user={{ id: userId }}>
      {children}
    </OptimizelyProvider>
  );
}
