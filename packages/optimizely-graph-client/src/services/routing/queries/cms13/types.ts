export type { VariationInput } from "../../types.js"

export type Route = {
  _metadata: {
    key: string
    version: string
    locale: string
    displayName: string
    types: Array<string>
    variation?: string | null
    changeset?: string | null
    url: {
      path: string
      domain: string
    }
    slug?: string | null
  }
  changed: string
}