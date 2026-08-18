/**
 * Error thrown when a value that was expected to be a valid ContentLink
 * could not be normalized into one.
 */
export class InvalidContentLinkError extends Error
{
  protected _contentLink : unknown

  /**
   * The invalid value that triggered this error
   */
  public get contentLink() : unknown 
  {
    return this._contentLink
  }

  /**
   * @param   invalidContentLink    The invalid value that was provided as content link
   * @param   message               Optional message to override the default error message
   */
  public constructor(invalidContentLink?: unknown, message?: string)
  {
    super(message ?? "Invalid content link")
    this._contentLink = invalidContentLink
  }
}