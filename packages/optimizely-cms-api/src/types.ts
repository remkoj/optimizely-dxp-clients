export type InstanceApiVersionInfo = {
    status: "Healthy"
    statusDuration: number
    apiVersion: string
    serviceVersion: string
    cmsVersion: string
    results: Record<string, any>
}

export enum OptiCmsVersion {
    CMS12 = "OPTI-CMS-12",
    CMS13 = "OPTI-CMS-13"
}