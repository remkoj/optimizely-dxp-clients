export type InstanceApiVersionInfo = {
  status: "Healthy"
  baseUrl?: string
  statusDuration: number
  apiVersion: string
  serviceVersion: string
  cmsVersion: string
  results: Record<string, any>
}
