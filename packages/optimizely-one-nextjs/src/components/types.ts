
import type { checkProductStatus } from '../config'
export type SupportedProductNames = keyof ReturnType<typeof checkProductStatus>