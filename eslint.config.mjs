import { defineConfig, globalIgnores } from 'eslint/config';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import stylistic from '@stylistic/eslint-plugin'
import { includeIgnoreFile } from "@eslint/compat";
import { globSync } from 'glob';

// Add all .eslintignore files in the project to the ESLint configuration. This 
// allows us to maintain a centralized list of ignored files and directories. Each
// package can have its own .eslintignore file, and we will include all of them in
// the ESLint configuration.
const ignoreFiles = globSync("**/.eslintignore", { 
  ignore: "**/node_modules/**",
  absolute: true
}).map(result => result);
console.log("ESLint configuration is set up to include the following ignore files:");
ignoreFiles.forEach(file => console.log(`- ${file}`));
const ignoreFileConfigs = ignoreFiles.map(file => includeIgnoreFile(file));

const esLintConfig = defineConfig([
  eslint.configs.recommended,
  tseslint.configs.recommended,

  // Handle Node.js scripts, which may use CommonJS or ESM and need 
  // access to Node globals
  {
    files: ["**/scripts/**/*.js","**/scripts/**/*.mjs","**/scripts/**/*.cjs"],
    languageOptions: {
      globals: globals.node
    }
  },

  // Stylistic rules for code formatting and style consistency. We can enable specific 
  // stylistic rules here, and they will be applied to all files.
  {
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      '@stylistic/indent': ['error', 2],
    }
  },

  // Include all .eslintignore files in the project to ensure that the ignore patterns
  // defined in those files are respected by ESLint. This allows us to maintain a 
  // centralized list of ignored files and directories across the entire project.
  ...ignoreFileConfigs,
  
  // Global ignore list of files and directories that should not be linted. This
  // includes build artifacts, dependencies, and other generated code that we 
  // don't want to enforce linting rules on.
  globalIgnores([
    ".*/**",
    "*.gen.ts",
    "*.gen.js",
    "artefacts/**",
    "dependencies/**",
    "node_modules/**",
    // Samples may or may not use ESLint, but we're not enforcing it from
    // here.
    "samples/**",
    // Dist folders in packages may contain generated code that doesn't follow 
    // our linting rules, so we ignore them (e.g. .rollup.cache, dist, node_modules).
    "packages/**/dist/**",
    "packages/**/bin/**",
    "packages/**/node_modules/**",
    "packages/**/.*/**",
  ]),

  // Make sure that the React plugin doesn't crash when it tries to 
  // auto-detect the React version in our packages that don't have React 
  // as a dependency
  {
    settings: {
      react: { version: "19" } // Avoids auto-detection crash
    }
  }
]);

export default esLintConfig;