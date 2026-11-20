# @remkoj/hey-api-wrapper — usage

Internal package. Not intended for direct use.

Consumed by `@remkoj/optimizely-cms-api` to wrap a `@hey-api`-generated SDK into
a single client object. Do not import this package directly in application code.

## Handling `ApiError`

`ApiError` (thrown by every operation method on failure) deliberately exposes the full, unmodified `request`, `response` and `data` (error payload). They can contain credentials (the `Authorization` header, tokens in the URL) and personal data (request/response bodies).

- Sanitizing is the implementor's responsibility: before writing an `ApiError`, or any of those properties, to a log, error reporter or other storage, or serializing it, remove or mask the sensitive values. Never forward them as-is.
- Do not remove or alter the request/response stored in `ApiError`; callers rely on them.
- Only `message` is sanitized by this package (control characters replaced, max. 500 characters). Debug logging (`debug: true`) masks the query-string values and drops credentials and fragment from the logged URLs.
