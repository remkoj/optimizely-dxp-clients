# @remkoj/hey-api-wrapper

> **Internal package.** Used by `@remkoj/optimizely-cms-api`. Not intended for direct use in application code.

Wraps a [`@hey-api`](https://heyapi.dev)-generated SDK into a single typed client class. Instead of calling raw operation functions, consumers get an object instance whose methods map one-to-one to the SDK operations, with authentication and error handling handled centrally.

## How it works

`@hey-api` generates a flat module of async operation functions (e.g. `listContent`, `createContentType`). This package provides two building blocks:

- **`ApiClient`** — abstract base class that holds the configuration and a `@hey-api` network client. Installs request/response logging interceptors when `debug: true`. The logged URLs have the credentials and fragment removed and the values of all query-string parameters masked (`?api_key=***`).
- **`withOperations`** — mixin factory that extends any `ApiClient` subclass with one method per generated operation. Each method injects the instance's network client, converts error results into `ApiError` throws, and returns the unwrapped `data` payload.

## Usage

```typescript
import { ApiClient, withOperations, ApiError } from '@remkoj/hey-api-wrapper'
import type { ApiClientConfig } from '@remkoj/hey-api-wrapper'
import { createClient } from '@hey-api/client-fetch'
import * as SdkOps from './client/sdk.gen'

// 1. Define your config type (extend ApiClientConfig to add your own fields)
type MyConfig = ApiClientConfig & {
  baseUrl: string
}

// 2. Create a concrete client class with all SDK operations attached
class MyApiClient extends withOperations(ApiClient, SdkOps) {
  constructor(config: MyConfig) {
    super(config, createClient({ baseUrl: config.baseUrl }))
  }
}

// 3. Use it — each SDK operation is available as a method
const api = new MyApiClient({ baseUrl: 'https://api.example.com', debug: true })
const result = await api.listContent({ query: { pageSize: 10 } })
```

## API

### `ApiClient`

Abstract base class. Subclass it (via `withOperations`) to build a concrete client.

| Member | Description |
|---|---|
| `debug` | `true` when request/response logging is active |
| `name` | Display name used in log output (from config, defaults to `'API Client'`) |
| `client` | The underlying `@hey-api` network client |

Constructor signature: `new ApiClient(config: ApiClientConfig, client: NetworkClient)`.

### `withOperations(Base, Operations)`

Mixin factory. Returns a new class that combines `Base` with one method per operation in `Operations`.

- Each method forwards its arguments to the corresponding operation, injecting `client` automatically.
- On success, returns the `data` field of the response (falls back to the full result when `data` is absent).
- On error, throws `ApiError`.

### `ApiError`

Thrown by operation methods when the server returns an error response.

| Property | Type | Description |
|---|---|---|
| `message` | `string` | Human-readable error (uses the error string or HTTP status) |
| `data` | `unknown` | Raw error payload from the response |
| `status` | `number` | HTTP status code |
| `statusText` | `string` | HTTP status text |
| `request` | `Request \| undefined` | The originating HTTP request, unmodified |
| `response` | `Response \| undefined` | The originating HTTP response, unmodified |

#### Sanitizing the error is your responsibility

`ApiError` deliberately keeps the **complete, unmodified** request, response and error payload, so that callers can inspect everything about a failed call. These can contain credentials and personal data: request headers (e.g. `Authorization`), access tokens in the request URL, and request or response bodies. If you output or store an `ApiError` or any of its properties anywhere (logs, error reporters, analytics, files, a serialized response), **you must sanitize it first**. This applies to humans and to AI agents modifying code that handles these errors: never pass `error.request`, `error.response`, `error.data` or the error object itself to such an output as-is.

Only `message` is sanitized by the package: control characters (e.g. line breaks) in a server-provided error string are replaced and the length is limited to 500 characters, to avoid log injection. The raw string remains available through `data`.

### Types

| Type | Description |
|---|---|
| `ApiClientConfig` | Base config: `{ debug?: boolean; name?: string }` |
| `OperationsList<T>` | Extracts the function-valued keys from an SDK module type |
| `ApiClientFunctions<L>` | Maps `OperationsList` entries to their unwrapped return types |
| `ClassWithMixin<TBase, Mixin>` | Result type of `withOperations` — `TBase` instance augmented with `Mixin` |

## License

Apache-2.0

