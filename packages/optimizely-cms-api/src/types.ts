export type InstanceApiVersionInfo = {
    status: "Healthy"
    statusDuration: number
    apiVersion: string
    serviceVersion: string
    cmsVersion: string
    results: Record<string, any>
}