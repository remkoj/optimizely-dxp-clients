/**
 * The context of a failed Optimizely Graph request, as far as it is known
 */
export type OptiGraphRequestErrorDetails = {
  /**
   * The request/correlation id that Optimizely Graph returned for the request,
   * quote this when contacting Optimizely Support.
   */
  requestId?: string

  /**
   * The HTTP status of the response
   */
  status?: number

  /**
   * The name of the GraphQL operation that was executed
   */
  operationName?: string
}

/**
 * Error thrown when Optimizely Graph reports errors for a request. It
 * intentionally only holds primitive values (no `Response`, `Headers`,
 * request or `cause`), so keeping a reference to it, e.g. by an error
 * reporter, does not retain the response of Optimizely Graph.
 */
export class OptiGraphRequestError extends Error implements OptiGraphRequestErrorDetails {
  /**
   * The request/correlation id that Optimizely Graph returned for the request
   */
  public readonly requestId?: string

  /**
   * The HTTP status of the response
   */
  public readonly status?: number

  /**
   * The name of the GraphQL operation that was executed
   */
  public readonly operationName?: string

  /**
   * @param   message   The error message, the request id is appended when known
   * @param   details   The context of the failed request
   */
  public constructor(message: string, details: OptiGraphRequestErrorDetails = {}) {
    super(details.requestId ? `${message} [request-id: ${details.requestId}]` : message)
    this.name = 'OptiGraphRequestError'
    this.requestId = details.requestId
    this.status = details.status
    this.operationName = details.operationName
  }
}

export default OptiGraphRequestError
