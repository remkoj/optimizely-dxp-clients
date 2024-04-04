import 'server-only';
import { type IOptiGraphClient } from '@remkoj/optimizely-graph-client';
export declare const getServerClient: () => IOptiGraphClient;
export declare const getAuthorizedServerClient: (token?: string) => IOptiGraphClient;
export declare const createClient: () => IOptiGraphClient;
export declare const createAuthorizedClient: (token?: string) => IOptiGraphClient;
declare const _default: IOptiGraphClient;
export default _default;
