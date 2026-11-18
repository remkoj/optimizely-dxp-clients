import dataPlatform from './index.js'
import { submitForm } from './submit-form.js'

export * from './index.js'
export { submitForm, type DataPlatformFormSubmission } from './submit-form.js'

export default { ...dataPlatform, submitForm }
