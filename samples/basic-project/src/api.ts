import { createClient } from "@remkoj/optimizely-cms-nextjs";
import { ServerContext } from "@remkoj/optimizely-cms-react/rsc";
import { getSdk } from "./gql/client";
import { factory } from "./components/factory";

/**
 * The always readonly, published content client that can be used in locations
 * that do not depend on the current request/authorization, for example custom
 * routes, APIs and Layouts.
 */
export const client = createClient();

/**
 * The always readonly, published content SDK that can be used in locations
 * that do not depend on the current request/authorization, for example custom
 * routes, APIs and Layouts.
 */
export const sdk = getSdk(client);

/**
 * The always readonly, published content context that can be used in locations
 * that do not depend on the current request/authorization, for example custom
 * routes, APIs and Layouts.
 */
export const publishedContext = new ServerContext({ factory, client, mode: 'public' })

export default client;
