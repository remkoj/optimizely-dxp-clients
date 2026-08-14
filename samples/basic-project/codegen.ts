// Leverage Next.JS configuration loading
import { loadEnvConfig } from '@next/env'
loadEnvConfig(__dirname, undefined, console)

// Import GraphQL Codegen configuration definition
import type { CodegenConfig } from '@graphql-codegen/cli'

// Import the tooling from the SDK
import getSchemaInfo from '@remkoj/optimizely-graph-client/codegen'
import { OptimizelyGraphPreset } from '@remkoj/optimizely-graph-functions/preset'

// Make sure that we don't cause issues...
if (__dirname !== process.cwd()) {
  process.stderr.write('Code generation isn\'t executed in the project root, this will cause undesired side-effects\n')
  process.exit(1)
}

// Create the configuration itself
const config: CodegenConfig = {

  // Configure the connection to Optimizely Graph, using the appropriate
  // configuration as well as ensuring that the chances of getting caught
  // by cache are minimized.
  schema: getSchemaInfo(),

  // Define where GraphQL Codegen is looking for GraphQL queries that need
  // to be optimized.
  documents: [
    // Add local GraphQL files
    'src/app/**/*.graphql',
    'src/components/cms/**/*.graphql',
    'src/components/layout/**/*.graphql',
    'src/components/shared/**/*.graphql',
    'src/lib/**/*.graphql',

    // Add queries embedded in TypeScript source files
    'src/app/**/*.(ts|tsx)',
    'src/components/cms/**/*.(ts|tsx)',
    'src/components/layout/**/*.(ts|tsx)',
    'src/components/shared/**/*.(ts|tsx)',
    'src/lib/**/*.(ts|tsx)',
  ],

  // This is needed to ensure that the generation works, even when there're
  // no local GraphQL files, and only the embedded GraphQL queries from the
  // SDK are available.
  ignoreNoDocuments: true,

  // Set this to true to even generate output upon error, the default is to
  // keep this disabled as partial outputs can cause difficult to debug
  // application errors.
  allowPartialOutputs: true,

  // Define the output of GraphQL Codegen. This should at a minimum include
  // the SDK output configuration.
  generates: {
    'src/gql/': OptimizelyGraphPreset.createOutputConfig({

      // The GQL tag to be used to identify inline GraphQL queries
      gqlTagName: 'graphql',
      
      // By default recursion is not supported by GraphQL Codegen
      // when you've installed the patched package, you can enable
      // it here.
      recursion: true,  

      // By default the queries 'getContentByPath' and 'getContentById'
      // are made available in a functions.ts file. Set this value to
      // override the queries in that file.
      // functions: ['getContentByPath', 'getContentById', 'getBlogSectionExperienceData'],

      // Enable query pretty-printing within functions.ts, by default
      // pretty-printing is disabled.
      // prettyPrintQuery: true,

      // Enable debugging output for the Optimizely Code Generation,
      // setting this value to true, will also create a file that
      // shows all built-in and auto-generated queries & fragments.
      // verbose: true,

      // Configure the fragments that will be spread into the utility
      // partial fragments. When you're overriding a built-in fragment
      // it loses it's default injection points. You must restore those
      // using this configuration.
      // - SectionData        => Visual Builder section layout types (_section baseType)
      // - PageData           => Page and experience types (_page / _experience baseType)
      // - MediaData          => Media asset types (_media / _image / _video baseType)
      // - ComponentData      => General-purpose components and blocks (replaces BlockData)
      // - ElementData        => Components with the elementEnabled composition behavior
      // - SectionElementData => Components with the sectionEnabled composition behavior
      // - FormElementData    => Components with the formsElementEnabled composition behavior
      // - BlockData          => Deprecated alias for ComponentData
      //
      // Auto-generated fragments (i.e. using the opti-cms:/ protocol) are
      // automatically injected. Also fragments located within files that
      // use any of the targets just before any of the supported extension
      // (jsx/js/tsx/ts/graphql) are auto-included.
      // 
      // For example: `fragmentFile.ComponentData.ElementData.graphql` will
      // have all fragments injected into ComponentData and ElementData.
      injections: [
        // Add Page/Experience GraphQL Files
        {
          into: 'PageData',
          pathRegex: 'src\/components\/cms\/.*\.page\.graphql'
        },
        {
          into: 'PageData',
          pathRegex: 'src\/components\/cms\/.*\.experience\.graphql'
        },

        // Add Block/Component/Section GraphQL Files
        {
          into: 'ComponentData',
          pathRegex: 'src\/components\/cms\/.*\.block\.graphql'
        },
        {
          into: 'ComponentData',
          pathRegex: 'src\/components\/cms\/.*\.component\.graphql'
        },
        {
          into: 'ComponentData',
          pathRegex: 'src\/components\/cms\/.*\.section\.graphql'
        },

        // Add Element GraphQL Files
        {
          into: 'ElementData',
          pathRegex: 'src\/components\/cms\/.*\.element\.graphql'
        }
      ]
    })
  }
};

export default config
