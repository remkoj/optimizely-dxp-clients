export { DataPlatformClient as Client, type DataPlatformError, type DataPlatformProfile as Profile } from './api'
export * as Tools from './helpers'
import { DataPlatformClient as Client, DataPlatformError } from './api'
import * as Tools from './helpers'

export default {
    Client,
    Tools,
    DataPlatformError
}