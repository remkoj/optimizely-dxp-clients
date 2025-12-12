import { createClient } from "@remkoj/optimizely-cms-nextjs";
import { getSdk } from "./gql/client";

export const client = createClient();
export const sdk = getSdk(client);

export default client;
