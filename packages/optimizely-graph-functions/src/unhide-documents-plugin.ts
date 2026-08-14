import type { CodegenPlugin } from '@graphql-codegen/plugin-helpers'
//import { isOptiCmsURL } from './generator/virtual-location'

export const UnhideGeneratedComponentsPlugin: CodegenPlugin<Record<string,unknown>> = {
  async plugin(schema, documents) {
    const data = (documents || [])
      /*.filter((d) => isOptiCmsURL(d.location))*/
      .map((doc) => `# Location: ${ doc.location }\n${ doc.rawSDL }`);
    return { 
      prepend: [
        '# This file is not used by the application, it only serves to make the',
        '# built in and auto-generated queries and fragments visible to you.',
        '# you may override any of these fragments & queries by implementing them',
        '# within your application',
        ' '
      ],
      content: data.join('\n\n') 
    }
  }
}

export default UnhideGeneratedComponentsPlugin;