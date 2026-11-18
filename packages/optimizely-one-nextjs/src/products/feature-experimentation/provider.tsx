'use client'
import * as FX from '@optimizely/react-sdk';
import { createContext, useCallback, useContext, useMemo, useEffect, useRef, useState, useSyncExternalStore, type PropsWithChildren } from 'react';
import { v4 as createGuid } from 'uuid';
import { useCookie } from '../../components/use-cookie.js';
import {
  createUser,
  createUserContext as createSdkUserContext,
  fetchQualifiedSegments,
  mergeAttributes,
  readVuidCookie,
  toDecision,
  type FeatureExperimentationAttributes,
  type FeatureExperimentationAttributesResolver,
  type FeatureExperimentationDecideOptions,
  type FeatureExperimentationDecision,
  type FeatureExperimentationSegmentOption,
  type FeatureExperimentationUser
} from './index.js';

/**
 * Props for the Feature Experimentation provider.
 */
export type FeatureExperimentationProviderProps = PropsWithChildren<{
  /** Feature Experimentation SDK key. */
  sdkKey: string,
  /** Name of the browser-readable cookie containing the visitor ID. */
  frontendCookie: string
  /** Enables provider diagnostics in the browser console. */
  debug?: boolean
  /**
   * URL to read the datafile from instead of the Optimizely CDN, which is the
   * datafile endpoint of the proxy (`OPTIMIZELY_FX_PROXY`).
   */
  datafileUrl?: string
  /**
   * Attributes of the visitor, as determined by the server. These are the
   * starting point for the attributes of the visitor in the browser.
   */
  attributes?: FeatureExperimentationAttributes
  /**
   * Enables ODP real-time audiences in the browser SDK client, set when ODP is
   * configured in this package (`OPTIMIZELY_DATAPLATFORM_ID`), which `<OptimizelyOne />`
   * does. Without it, no ODP manager is created and no segments are fetched.
   * Defaults to `false`.
   */
  odpEnabled?: boolean
  /**
   * The ODP real-time audiences (segments) of the visitor, when fetched by the
   * server (`getQualifiedSegments`). The browser then doesn't fetch them from ODP
   * for its decisions. Without it, the browser fetches them itself, using the
   * ODP integration of the datafile.
   */
  qualifiedSegments?: string[]
  /**
   * Function (client function or Server Function) that is executed asynchronously
   * in the browser, to update the attributes of the visitor with values that are
   * not known when rendering, see {@link ResolveFeatureExperimentationAttributes}.
   */
  resolveAttributes?: FeatureExperimentationAttributesResolver
}>

const clients = new Map<string, FX.Client>();

/**
 * Returns the shared Feature Experimentation client for an SDK key, creating
 * it on first use. Creating a client starts fetching the datafile, so it is
 * cached at module level to prevent duplicate clients (and datafile requests)
 * when React re-runs renders, e.g. in Strict Mode or after a remount.
 *
 * @param sdkKey       The Feature Experimentation SDK key.
 * @param datafileUrl  Optional URL to read the datafile from, instead of the CDN.
 * @param odpEnabled   Whether to create the client with an ODP manager (ODP real-time audiences).
 * @returns            The cached client for the SDK key and datafile URL.
 */
function getClient(sdkKey: string, datafileUrl?: string, odpEnabled = false): FX.Client {
  const cacheKey = `${sdkKey}|${datafileUrl ?? ''}|${odpEnabled ? 'odp' : ''}`;
  let client = clients.get(cacheKey);
  if (!client) {
    client = FX.createInstance({
      projectConfigManager: FX.createPollingProjectConfigManager({
        sdkKey,
        ...(datafileUrl ? { urlTemplate: datafileUrl } : {}),
        autoUpdate: true,
        updateInterval: 1000 * 60, // Update every minute
      }),
      eventProcessor: FX.createBatchEventProcessor({
        batchSize: 10, // Send events in batches of 10 (or when flush interval is reached)
        flushInterval: 1000 * 30, // Flush every 30 seconds
      }),
      ...(odpEnabled ? {
        odpManager: FX.createOdpManager({
          eventBatchSize: 10,
          eventFlushInterval: 1000 * 30,
        }),
      } : {}),
      vuidManager: FX.createVuidManager({
        enableVuid: true,
      }),
    }) as FX.Client;
    clients.set(cacheKey, client);
  }
  return client;
}

type FeatureExperimentationContextValue = {
  /** The visitor, `undefined` until `ready` (so server rendering and hydration match). */
  user: FeatureExperimentationUser | undefined
  /** `false` while rendering on the server and during hydration, `true` once the visitor is known in the browser. */
  ready: boolean
  /** Whether ODP real-time audiences are enabled (ODP is configured in this package). */
  odpEnabled: boolean
  setAttributes: (attributes: FeatureExperimentationAttributes) => void
  /** Resolves with the visitor as soon as it is known. */
  whenReady: () => Promise<FeatureExperimentationUser>
}

const subscribeNever = () => () => {};

const FeatureExperimentationContext = createContext<FeatureExperimentationContextValue | undefined>(undefined);

/**
 * Initializes the Optimizely Feature Experimentation SDK for descendant components.
 *
 * The SDK client is shared per SDK key, datafile URL and ODP setting (see {@link getClient}).
 * The configured visitor cookie is preferred. If it is absent, a stable
 * per-mount ID is used rather than generating a new user ID on every render.
 * The visitor, including its attributes, is available through
 * {@link useFeatureExperimentationUser} and {@link useFeatureExperimentation}.
 *
 * The visitor is only known in the browser, so it is `undefined` (`ready` is `false`)
 * while rendering on the server and during hydration, and set right after. This keeps
 * the server rendered HTML and the first client render identical, so components that
 * use these hooks don't cause hydration errors.
 *
 * ODP real-time audiences are only used with `odpEnabled` (ODP configured in this package):
 * unless `qualifiedSegments` is given, the segments of the visitor are fetched from ODP
 * (when the project has the integration enabled in Feature Experimentation) by the ODP visitor ID
 * from the `vuid` cookie, so audiences that use them apply to the decisions of the SDK hooks too.
 * The SDK's own lookup (by `fs_user_id`) is not used by the provider, ODP often rejects it.
 *
 * Attributes start as `attributes`; `resolveAttributes` (if set) then runs once per
 * visitor and its result is merged in, which updates the decisions of the hooks.
 *
 * @param props Provider configuration and children.
 * @returns The Feature Experimentation SDK provider.
 */
export default function FeatureExperimentationProvider({ sdkKey, frontendCookie, debug = false, datafileUrl, odpEnabled = false, attributes: serverAttributes, qualifiedSegments, resolveAttributes, children }: FeatureExperimentationProviderProps) {
  const [fallbackUserId] = useState(() => createGuid().replaceAll('-', ''));
  const [cookieUserId, setCookieUserId] = useCookie(frontendCookie);
  const [clientAttributes, setClientAttributes] = useState<FeatureExperimentationAttributes>({});
  // false on the server and while hydrating, true after: the browser-only visitor ID must not be rendered before that
  const ready = useSyncExternalStore(subscribeNever, () => true, () => false);
  const userId = ready ? (cookieUserId || fallbackUserId) : undefined;
  const attributesKey = JSON.stringify(mergeAttributes(serverAttributes, clientAttributes));
  const user = useMemo(() => userId ? createUser(userId, JSON.parse(attributesKey), qualifiedSegments) : undefined, [userId, attributesKey, qualifiedSegments]);
  const setAttributes = useCallback((attributes: FeatureExperimentationAttributes) => {
    setClientAttributes(current => mergeAttributes(current, attributes));
  }, []);
  const userRef = useRef(user);
  const waiters = useRef<Array<(user: FeatureExperimentationUser) => void>>([]);
  const whenReady = useCallback(() => userRef.current
    ? Promise.resolve(userRef.current)
    : new Promise<FeatureExperimentationUser>(resolve => { waiters.current.push(resolve) }), []);
  const contextValue = useMemo(() => ({ user, ready, odpEnabled, setAttributes, whenReady }), [user, ready, odpEnabled, setAttributes, whenReady]);
  const optimizelyClient = getClient(sdkKey, datafileUrl, odpEnabled);
  const [fetchedSegments, setFetchedSegments] = useState<{ userId: string, segments: string[] }>();

  useEffect(() => {
    if (!odpEnabled || qualifiedSegments || !userId)
      return;
    let cancelled = false;
    (async () => {
      await optimizelyClient.onReady();
      // The ODP tracker sets the `vuid` cookie shortly after loading, wait a little for it
      for (let attempt = 0; attempt < 10 && !readVuidCookie(); attempt++)
        await new Promise(resolve => setTimeout(resolve, 500));
      const segments = await fetchQualifiedSegments(optimizelyClient, { id: userId });
      if (!cancelled)
        setFetchedSegments({ userId, segments });
    })().catch(error => console.error('🔴 [FeatureExperimentation] Unable to fetch the real-time audiences', error));
    return () => { cancelled = true; };
  }, [optimizelyClient, odpEnabled, qualifiedSegments, userId]);

  const providerSegments = qualifiedSegments ?? (fetchedSegments?.userId === userId ? fetchedSegments?.segments : undefined);

  useEffect(() => {
    userRef.current = user;
    if (user)
      waiters.current.splice(0).forEach(resolve => resolve(user));
  }, [user]);

  useEffect(() => {
    if (ready && !cookieUserId)
      setCookieUserId(fallbackUserId);
  }, [ready, cookieUserId, fallbackUserId, setCookieUserId]);

  useEffect(() => {
    if (debug || process.env.NODE_ENV === 'development') {
      console.groupCollapsed('🔧 [FeatureExperimentationProvider] Debug mode enabled');
      console.log('🔑 SDK Key:', sdkKey);
      console.log('📄 Datafile URL:', datafileUrl ?? 'Optimizely CDN');
      console.log('🍪 Frontend Cookie:', frontendCookie);
      console.log('👤 User:', user);
      console.groupEnd();
    }
  }, [sdkKey, datafileUrl, frontendCookie, user, debug]);

  return (
    <FX.OptimizelyProvider client={optimizelyClient} user={user ? { id: user.id, attributes: user.attributes } : null} skipSegments qualifiedSegments={providerSegments}>
      <FeatureExperimentationContext.Provider value={contextValue}>
        {resolveAttributes && <ResolveFeatureExperimentationAttributes resolve={resolveAttributes} />}
        {children}
      </FeatureExperimentationContext.Provider>
    </FX.OptimizelyProvider>
  );
}

/**
 * Executes a function (client function or Server Function) in the browser to
 * determine attributes of the visitor, and merges the result into the attributes
 * of the visitor. It runs once for each visitor ID, so decisions are made with the
 * initial attributes first and are updated when the function resolves. Failures
 * are logged and leave the attributes as they were. Renders nothing.
 *
 * Use it within `<OptimizelyOne />` with Feature Experimentation configured, for
 * example for attributes that are calculated in the browser. For attributes that
 * need `cookies()` or `headers()`, pass a Server Function through the
 * `fxResolveAttributes` property of `<OptimizelyOne />`.
 *
 * @param props.resolve The function that determines the attributes
 * @returns `null`
 * @throws  When used outside the Feature Experimentation provider.
 */
export function ResolveFeatureExperimentationAttributes({ resolve }: { resolve: FeatureExperimentationAttributesResolver }): null {
  const { user, setAttributes } = useFeatureExperimentationUser();
  const resolveRef = useRef(resolve);
  const currentUserRef = useRef(user);
  resolveRef.current = resolve;
  currentUserRef.current = user;
  const userId = user?.id;

  useEffect(() => {
    if (!userId || !currentUserRef.current)
      return;
    const target = currentUserRef.current;
    let cancelled = false;
    Promise.resolve()
      .then(() => resolveRef.current(target))
      .then(attributes => { if (!cancelled && attributes) setAttributes(attributes); })
      .catch(error => console.error('🔴 [FeatureExperimentation] Unable to resolve attributes', error));
    return () => { cancelled = true; };
  }, [userId, setAttributes]);

  return null;
}

/**
 * Read the visitor that decisions are made for, and update its attributes.
 * Must be used within `<OptimizelyOne />` with Feature Experimentation configured.
 *
 * The visitor ID only exists in the browser. While `ready` is `false` (server
 * rendering and hydration) `user` is `undefined`, so render a fallback until `ready`
 * to prevent hydration errors.
 *
 * @returns The `user` (identifier and attributes, `undefined` until `ready`), `ready`,
 *          `setAttributes`, which merges attributes into the visitor's attributes, and
 *          `whenReady`, which resolves with the visitor once it is known.
 * @throws  When used outside the Feature Experimentation provider.
 */
export function useFeatureExperimentationUser(): FeatureExperimentationContextValue {
  const context = useContext(FeatureExperimentationContext);
  if (!context)
    throw new Error('useFeatureExperimentationUser must be used within <OptimizelyOne /> with Feature Experimentation configured (OPTIMIZELY_FX_SDKKEY)');
  return context;
}

/**
 * Client-side counterpart of the server-side decision methods. The decisions are
 * made for the visitor of the provider, unless another `user` is given, and are
 * plain objects, identical to the server-side decisions.
 *
 * Decisions need the visitor, which is only known in the browser. The decision methods
 * wait for it when called earlier, but the decisions themselves are only available after
 * mount: render a fallback until the decision is set (or until `ready`), so the
 * server rendered HTML and the first client render match.
 *
 * ODP real-time audiences are used by the decisions when ODP is configured in this package
 * (`OPTIMIZELY_DATAPLATFORM_ID`): they are the `qualifiedSegments` of the visitor when known,
 * otherwise fetched from ODP (see `skipSegments` and `segmentOptions`). Without ODP configured
 * no segments are fetched and `getQualifiedSegments` returns the known ones, or an empty list.
 *
 * @returns The `user` (`undefined` until `ready`), `ready`, `setAttributes`, the async
 *          `decide`, `decideForKeys` and `decideAll` methods, and `getQualifiedSegments`,
 *          which returns the ODP real-time audiences (segments) of the visitor.
 * @throws  When used outside the Feature Experimentation provider.
 */
export function useFeatureExperimentation() {
  const { user, ready, odpEnabled, setAttributes, whenReady } = useFeatureExperimentationUser();
  const client = FX.useOptimizelyClient();

  const createUserContext = useCallback(async (override?: FeatureExperimentationUser, segments?: Pick<FeatureExperimentationDecideOptions, 'skipSegments' | 'segmentOptions'>) => {
    if (!client)
      throw new Error('The Feature Experimentation client is not available');
    await client.onReady();
    return createSdkUserContext(client, override ?? user ?? await whenReady(), { ...segments, skipSegments: segments?.skipSegments || !odpEnabled });
  }, [client, user, odpEnabled, whenReady]);

  const decide = useCallback(async (flagKey: string, { user: override, options, skipSegments, segmentOptions }: FeatureExperimentationDecideOptions = {}): Promise<FeatureExperimentationDecision> =>
    toDecision((await createUserContext(override, { skipSegments, segmentOptions })).decide(flagKey, options)), [createUserContext]);

  const decideForKeys = useCallback(async (flagKeys: string[], { user: override, options, skipSegments, segmentOptions }: FeatureExperimentationDecideOptions = {}): Promise<Record<string, FeatureExperimentationDecision>> => {
    const decisions = (await createUserContext(override, { skipSegments, segmentOptions })).decideForKeys(flagKeys, options);
    return Object.fromEntries(Object.entries(decisions).map(([key, decision]) => [key, toDecision(decision)]));
  }, [createUserContext]);

  const decideAll = useCallback(async ({ user: override, options, skipSegments, segmentOptions }: FeatureExperimentationDecideOptions = {}): Promise<Record<string, FeatureExperimentationDecision>> => {
    const decisions = (await createUserContext(override, { skipSegments, segmentOptions })).decideAll(options);
    return Object.fromEntries(Object.entries(decisions).map(([key, decision]) => [key, toDecision(decision)]));
  }, [createUserContext]);

  const getQualifiedSegments = useCallback(async (override?: FeatureExperimentationUser, segmentOptions?: FeatureExperimentationSegmentOption[]): Promise<string[]> => {
    if (!client)
      throw new Error('The Feature Experimentation client is not available');
    await client.onReady();
    const target = override ?? user ?? await whenReady();
    if (!odpEnabled)
      return target.qualifiedSegments ?? [];
    return fetchQualifiedSegments(client, target, segmentOptions);
  }, [client, user, odpEnabled, whenReady]);

  return { user, ready, setAttributes, decide, decideForKeys, decideAll, getQualifiedSegments };
}
