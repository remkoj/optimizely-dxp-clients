# Overriding queries & fragments
The Optimizely SaaS CMS preset for GraphQL-Codegen automatically generates a number of additional virtual files with built-in & auto-generated queries and fragments. These queries and fragments enable a much faster development based upon the types available in Optimizely Graph.

## Workflow
With this workflow the code can be automatically validated against the schema in Optimizely Graph when the application builds. In order to incorporate this validation in your build process, you've two options:

1. Add the `graphql-codegen` command to your `build` script in your `package.json`, this will work for almost any hosted environment.<br><br>**For example:**
```json
{
  scripts: {
    build: "graphql-codegen && next build"
  }
}
```

2. Run the `graphql-codegen` command prior to the `build` script within your CI/CD pipeline.

Due to the automatic generation of the fragments and queries these will always be available in the generated code and do not require you to write the explicitly in your project.

## Overriding
All provided hard-coded queries and fragments are only loaded into the documents used by `graphql-codegen` when the project does not include an implementation for this query or fragment.

When overriding any of the fragments that must be injected into other queries/fragments to allow dynamic building of queries, make sure that the injection will be done with the `injections` section in the codegen.ts file.

## Debugging
When you run `graphql-codegen` with the `--verbose` parameter it will show what it's doing and provide more details on errors. If the location of the document that triggers an error starts with `opti-cms:/` this is a dynamically generated/injected document. Override the default implementation (see above) to resolve the error.