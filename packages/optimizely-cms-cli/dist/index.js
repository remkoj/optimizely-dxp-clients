import { globSync, glob } from 'glob';
import dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import { getCmsIntegrationApiConfigFromEnvironment, createClient } from '@remkoj/optimizely-cms-api';
import yargs from 'yargs';
import path from 'node:path';
import fs from 'node:fs';
import chalk from 'chalk';
import figures from 'figures';
import Table from 'cli-table3';

/**
 * Prepare the application context, by parsing the .env files in the main
 * application directory.
 *
 * @returns     A string array with the files processed
 */
function prepare() {
    const envFiles = globSync(".env*").sort((a, b) => b.length - a.length).filter(n => n == ".env" || n == ".env.local" || (process.env.NODE_ENV && n == `.env.${process.env.NODE_ENV}.local`));
    expand(dotenv.config({ path: envFiles }));
    return envFiles;
}

function createOptiCmsApp(scriptName, version, epilogue) {
    const config = getCmsIntegrationApiConfigFromEnvironment();
    return yargs(process.argv)
        .scriptName(scriptName)
        .version(version )
        .usage('$0 <cmd> [args]')
        .option("path", { alias: "p", description: "Application root folder", string: true, type: "string", demandOption: false, default: process.cwd() })
        .option("components", { alias: "c", description: "Path to components folder", string: true, type: "string", demandOption: false, default: "./src/components/cms" })
        .option("cms_url", { alias: "cu", description: "Optimizely CMS URL", string: true, type: "string", demandOption: isDemanded(config.base), default: config.base, coerce: (val) => new URL(val) })
        .option("client_id", { alias: "ci", description: "API Client ID", string: true, type: "string", demandOption: isDemanded(config.clientId), default: config.clientId })
        .option('client_secret', { alias: "cs", description: "API Client Secrent", string: true, type: "string", demandOption: isDemanded(config.clientSecret), default: config.clientSecret })
        .option('user_id', { alias: "uid", description: "Impersonate user id", string: true, type: "string", demandOption: false, default: config.actAs })
        .option('verbose', { description: "Enable logging", boolean: true, type: 'boolean', demandOption: false, default: config.debug })
        .demandCommand(1, 1)
        .showHelpOnFail(true)
        .epilogue(`Copyright Remko Jantzen - 2023-${(new Date(Date.now())).getFullYear()}`)
        .help();
}
function isDemanded(value) {
    if (value == undefined || value == null)
        return true;
    switch (typeof (value)) {
        case 'string':
            return value == "";
    }
    return false;
}

/**
 * Parse the CLI configuration into usable values
 *
 * @param       param0      The parameters from the Command Line application
 * @returns     The arguments, with the Optimizely CMS Client parameters transformed into a configuration object
 */
function parseArgs({ client_id, client_secret, cms_url, user_id, verbose, path: argsPath, components: argsComponents, ...args }) {
    const appPath = path.isAbsolute(argsPath) ? argsPath : path.normalize(path.join(process.cwd(), argsPath));
    const componentDir = path.normalize(path.join(argsPath, argsComponents));
    if (!componentDir.startsWith(argsPath))
        throw new Error(`The component directory ${componentDir} is outside the application directory (${appPath})`);
    return {
        _config: {
            base: cms_url,
            clientId: client_id,
            clientSecret: client_secret,
            actAs: user_id,
            debug: verbose
        },
        ...args,
        path: appPath,
        components: componentDir
    };
}

const StylesPushCommand = {
    command: "styles:push",
    describe: "Push Visual Builder style definitions into the CMS (create/replace)",
    handler: async (args) => {
        const { _config: cfg, ...opts } = parseArgs(args);
        const client = createClient(cfg);
        /*const currentTemplates = await client.displayTemplates.displayTemplatesList()
        currentTemplates.items?.map(tpl => {
            console.log(JSON.stringify(tpl, undefined, 4))
        })*/
        process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Pushing (create/replace) DisplayStyles into Optimizely CMS\n`));
        const styleDefinitionFiles = await glob("./**/*.opti-style.json", {
            cwd: opts.components
        });
        const results = await Promise.all(styleDefinitionFiles.map(async (styleDefinitionFile) => {
            const filePath = path.normalize(path.join(opts.components, styleDefinitionFile));
            const styleDefinition = tryReadJsonFile(filePath, cfg.debug);
            const styleKey = styleDefinition.key;
            if (!styleKey) {
                process.stderr.write(chalk.redBright(`${chalk.bold(figures.cross)} The style definition in ${path.relative(opts.path, filePath)} does not have a key defined\n`));
                return;
            }
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${figures.arrowRight} Pushing: ${styleKey}\n`));
            const newTemplate = await client.displayTemplates.displayTemplatesPut(styleKey, styleDefinition);
            return newTemplate;
        }));
        const styles = new Table({
            head: [
                chalk.yellow(chalk.bold("Name")),
                chalk.yellow(chalk.bold("Key")),
                chalk.yellow(chalk.bold("Default")),
                chalk.yellow(chalk.bold("Target"))
            ],
            colWidths: [31, 20, 9, 20],
            colAligns: ["left", "left", "center", "left"]
        });
        results.forEach(tpl => {
            styles.push([
                tpl.displayName,
                tpl.key,
                tpl.isDefault ? figures.tick : figures.cross,
                tpl.contentType ? `${tpl.contentType} (C)` : tpl.baseType ? `${tpl.baseType} (B)` : `${tpl.nodeType} (N)`
            ]);
        });
        process.stdout.write(styles.toString() + "\n");
        process.stdout.write(chalk.green(chalk.bold(figures.tick + " Done")) + "\n");
    }
};
function tryReadJsonFile(filePath, debug = false) {
    try {
        if (debug)
            process.stdout.write(chalk.gray(`${figures.arrowRight} Reading style definition from ${filePath}\n`));
        return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf-8' }));
    }
    catch (e) {
        process.stderr.write(chalk.redBright(`${chalk.bold(figures.cross)} Error while reading ${filePath}\n`));
    }
    return undefined;
}

const StylesListCommand = {
    command: "styles:list",
    describe: "List Visual Builder style definitions from the CMS",
    handler: async (args) => {
        const { _config: cfg, ...opts } = parseArgs(args);
        const client = createClient(cfg);
        const pageSize = 100;
        process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Reading DisplayStyles from Optimizely CMS\n`));
        if (cfg.debug)
            process.stdout.write(chalk.gray(`${figures.arrowRight} Fetching page 1 of ? (${pageSize} items per page)\n`));
        let templatesPage = await client.displayTemplates.displayTemplatesList(0, pageSize);
        const results = templatesPage.items ?? [];
        let pagesRemaining = Math.ceil(templatesPage.totalItemCount / templatesPage.pageSize) - (templatesPage.pageIndex + 1);
        while (pagesRemaining > 0 && results.length < templatesPage.totalItemCount) {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${figures.arrowRight} Fetching page ${templatesPage.pageIndex + 2} of ${Math.ceil(templatesPage.totalItemCount / templatesPage.pageSize)} (${templatesPage.pageSize} items per page)\n`));
            templatesPage = await client.displayTemplates.displayTemplatesList(templatesPage.pageIndex + 1, templatesPage.pageSize);
            results.push(...templatesPage.items);
            pagesRemaining = Math.ceil(templatesPage.totalItemCount / templatesPage.pageSize) - (templatesPage.pageIndex + 1);
        }
        const styles = new Table({
            head: [
                chalk.yellow(chalk.bold("Name")),
                chalk.yellow(chalk.bold("Key")),
                chalk.yellow(chalk.bold("Default")),
                chalk.yellow(chalk.bold("Target"))
            ],
            colWidths: [31, 20, 9, 20],
            colAligns: ["left", "left", "center", "left"]
        });
        results.forEach(tpl => {
            styles.push([
                tpl.displayName,
                tpl.key,
                tpl.isDefault ? figures.tick : figures.cross,
                tpl.contentType ? `${tpl.contentType} (C)` : tpl.baseType ? `${tpl.baseType} (B)` : `${tpl.nodeType} (N)`
            ]);
        });
        process.stdout.write(styles.toString() + "\n");
        process.stdout.write(chalk.green(chalk.bold(figures.tick + " Done")) + "\n");
    }
};

const StylesPullCommand = {
    command: "styles:pull",
    describe: "Create Visual Builder style definitions from the CMS",
    handler: async (args) => {
        const { _config: cfg, components: basePath } = parseArgs(args);
        const client = createClient(cfg);
        const pageSize = 100;
        process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Reading DisplayStyles from Optimizely CMS\n`));
        if (cfg.debug)
            process.stdout.write(chalk.gray(`${figures.arrowRight} Fetching page 1 of ? (${pageSize} items per page)\n`));
        let templatesPage = await client.displayTemplates.displayTemplatesList(0, pageSize);
        const results = templatesPage.items ?? [];
        let pagesRemaining = Math.ceil(templatesPage.totalItemCount / templatesPage.pageSize) - (templatesPage.pageIndex + 1);
        while (pagesRemaining > 0 && results.length < templatesPage.totalItemCount) {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${figures.arrowRight} Fetching page ${templatesPage.pageIndex + 2} of ${Math.ceil(templatesPage.totalItemCount / templatesPage.pageSize)} (${templatesPage.pageSize} items per page)\n`));
            templatesPage = await client.displayTemplates.displayTemplatesList(templatesPage.pageIndex + 1, templatesPage.pageSize);
            results.push(...templatesPage.items);
            pagesRemaining = Math.ceil(templatesPage.totalItemCount / templatesPage.pageSize) - (templatesPage.pageIndex + 1);
        }
        if (cfg.debug)
            process.stdout.write(chalk.gray(`${figures.arrowRight} Fetched ${results.length} Content-Types from Optimizely CMS\n`));
        if (!fs.existsSync(basePath))
            fs.mkdirSync(basePath, { recursive: true });
        if (!fs.statSync(basePath).isDirectory()) {
            process.stderr.write(chalk.redBright(`${chalk.bold(figures.cross)} The components path ${basePath} is not a folder\n`));
            process.exit(1);
        }
        const typeFiles = {};
        const updatedTemplates = await Promise.all(results.map(async (displayTemplate) => {
            let itemPath = undefined;
            let targetType;
            let typesPath;
            if (displayTemplate.nodeType) {
                itemPath = path.join(basePath, 'styles', displayTemplate.nodeType, displayTemplate.key);
                typesPath = path.join(basePath, 'styles', displayTemplate.nodeType);
                targetType = 'node/' + displayTemplate.nodeType;
            }
            else if (displayTemplate.baseType) {
                itemPath = path.join(basePath, displayTemplate.baseType, 'styles', displayTemplate.key);
                typesPath = path.join(basePath, displayTemplate.baseType, 'styles');
                targetType = 'base/' + displayTemplate.baseType;
            }
            else if (displayTemplate.contentType) {
                const contentType = await client.contentTypes.contentTypesGet(displayTemplate.contentType ?? '-');
                itemPath = path.join(basePath, contentType.baseType, contentType.key);
                typesPath = path.join(basePath, contentType.baseType, contentType.key);
                targetType = 'content/' + displayTemplate.contentType;
            }
            if (!fs.existsSync(itemPath))
                fs.mkdirSync(itemPath, { recursive: true });
            // Write Style JSON
            const filePath = path.join(itemPath, `${displayTemplate.key}.opti-style.json`);
            fs.writeFileSync(filePath, JSON.stringify(displayTemplate, undefined, 2));
            if (!typeFiles[targetType]) {
                typeFiles[targetType] = {
                    filePath: path.join(typesPath, 'displayTemplates.ts'),
                    templates: []
                };
            }
            typeFiles[targetType].templates.push(displayTemplate);
            return displayTemplate.key;
        }));
        for (const targetId of Object.getOwnPropertyNames(typeFiles)) {
            const { filePath: typeFilePath, templates } = typeFiles[targetId];
            // Write Style definition
            const typeContents = [];
            let typeId = undefined;
            templates.forEach(displayTemplate => {
                if (Object.getOwnPropertyNames(displayTemplate.settings).length > 0) {
                    typeContents.push(`export type ${displayTemplate.key}Settings = Array<`);
                    const typeSettings = [];
                    for (const settingName of Object.getOwnPropertyNames(displayTemplate.settings)) {
                        const settingOptions = '"' + Object.getOwnPropertyNames(displayTemplate.settings[settingName].choices).join('" | "') + '"';
                        typeSettings.push(`    { key: "${settingName}", value: ${settingOptions}}`);
                    }
                    typeContents.push(typeSettings.join(" |\n"));
                    typeContents.push('>');
                }
                else {
                    typeContents.push(`export type ${displayTemplate.key}Settings = []`);
                }
                typeContents.push(`export type ${displayTemplate.key}LayoutProps = {`);
                typeContents.push(`    template: "${displayTemplate.key}"`);
                typeContents.push(`    settings: ${displayTemplate.key}Settings`);
                typeContents.push(`}`);
                typeId = displayTemplate.contentType ?? displayTemplate.baseType ?? displayTemplate.nodeType;
                typeId = typeId[0]?.toUpperCase() + typeId.substring(1) + "LayoutProps";
            });
            typeContents.push(`export type ${typeId} = ${templates.map(t => t.key + "LayoutProps").join(' | ')}`);
            typeContents.push(`export default ${typeId}`);
            fs.writeFileSync(typeFilePath, typeContents.join("\n"));
        }
        process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Created/updated style definitions for ${updatedTemplates.join(', ')}\n`));
        process.stdout.write(chalk.green(chalk.bold(figures.tick + " Done")) + "\n");
    }
};

const TypesPullCommand = {
    command: "types:pull",
    describe: "Pull content type definition files into the project",
    builder: (yargs) => {
        yargs.option('force', { alias: 'f', description: "Overwrite existing files", boolean: true, type: 'boolean', demandOption: false, default: false });
        yargs.option('excludeTypes', { alias: 'ect', description: "Exclude these content types", string: true, type: 'array', demandOption: false, default: [] });
        yargs.option('excludeBaseTypes', { alias: 'ebt', description: "Exclude these base types", string: true, type: 'array', demandOption: false, default: ['folder', 'media', 'image', 'video'] });
        return yargs;
    },
    handler: async (args) => {
        const { _config: cfg, components: basePath, excludeBaseTypes, excludeTypes } = parseArgs(args);
        const client = createClient(cfg);
        const pageSize = 100;
        process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Pulling Content Types from Optimizely CMS\n`));
        if (cfg.debug)
            process.stdout.write(chalk.gray(`${figures.arrowRight} Fetching page 1 of ? (${pageSize} items per page)\n`));
        let templatesPage = await client.contentTypes.contentTypesList(undefined, undefined, 0, pageSize);
        const results = templatesPage.items ?? [];
        let pagesRemaining = Math.ceil(templatesPage.totalItemCount / templatesPage.pageSize) - (templatesPage.pageIndex + 1);
        while (pagesRemaining > 0 && results.length < templatesPage.totalItemCount) {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${figures.arrowRight} Fetching page ${templatesPage.pageIndex + 2} of ${Math.ceil(templatesPage.totalItemCount / templatesPage.pageSize)} (${templatesPage.pageSize} items per page)\n`));
            templatesPage = await client.contentTypes.contentTypesList(undefined, undefined, templatesPage.pageIndex + 1, templatesPage.pageSize);
            results.push(...templatesPage.items);
            pagesRemaining = Math.ceil(templatesPage.totalItemCount / templatesPage.pageSize) - (templatesPage.pageIndex + 1);
        }
        if (cfg.debug)
            process.stdout.write(chalk.gray(`${figures.arrowRight} Fetched ${results.length} Content-Types from Optimizely CMS\n`));
        if (!fs.existsSync(basePath))
            fs.mkdirSync(basePath, { recursive: true });
        if (!fs.statSync(basePath).isDirectory()) {
            process.stderr.write(chalk.redBright(`${chalk.bold(figures.cross)} The components path ${basePath} is not a folder\n`));
            process.exit(1);
        }
        const updatedTypes = results.map(contentType => {
            if (excludeBaseTypes.includes(contentType.baseType)) {
                if (cfg.debug)
                    process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping ${contentType.displayName} (${contentType.key}) - Base type excluded\n`));
                return undefined;
            }
            if (excludeTypes.includes(contentType.key)) {
                if (cfg.debug)
                    process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping ${contentType.displayName} (${contentType.key}) - Content type excluded\n`));
                return undefined;
            }
            const typePath = path.join(basePath, contentType.baseType, contentType.key);
            const typeFile = path.join(typePath, `${contentType.key}.opti-type.json`);
            if (!fs.existsSync(typePath))
                fs.mkdirSync(typePath, { recursive: true });
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${figures.arrowRight} Writing type definition for ${contentType.displayName} (${contentType.key})\n`));
            fs.writeFileSync(typeFile, JSON.stringify(contentType, undefined, 2));
            return contentType.key;
        }).filter(x => x);
        process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Created/updated type definitions for ${updatedTypes.join(', ')}\n`));
        process.stdout.write(chalk.green(chalk.bold(figures.tick + " Done")) + "\n");
    }
};

const NextJsCreateCommand = {
    command: "nextjs:create",
    describe: "Scaffold a complete Next.JS / Optimizely Graph structure",
    builder: (yargs) => {
        yargs.option('force', { alias: 'f', description: "Overwrite existing files", boolean: true, type: 'boolean', demandOption: false, default: false });
        yargs.option('excludeTypes', { alias: 'ect', description: "Exclude these content types", string: true, type: 'array', demandOption: false, default: [] });
        yargs.option('excludeBaseTypes', { alias: 'ebt', description: "Exclude these base types", string: true, type: 'array', demandOption: false, default: ['folder', 'media', 'image', 'video'] });
        return yargs;
    },
    handler: async (args) => {
        const { _config: cfg, components: basePath, excludeBaseTypes, excludeTypes, force } = parseArgs(args);
        const client = createClient(cfg);
        const pageSize = 100;
        process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Pulling Content Types from Optimizely CMS\n`));
        if (cfg.debug)
            process.stdout.write(chalk.gray(`${figures.arrowRight} Fetching page 1 of ? (${pageSize} items per page)\n`));
        let templatesPage = await client.contentTypes.contentTypesList(undefined, undefined, 0, pageSize);
        const results = templatesPage.items ?? [];
        let pagesRemaining = Math.ceil(templatesPage.totalItemCount / templatesPage.pageSize) - (templatesPage.pageIndex + 1);
        while (pagesRemaining > 0 && results.length < templatesPage.totalItemCount) {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${figures.arrowRight} Fetching page ${templatesPage.pageIndex + 2} of ${Math.ceil(templatesPage.totalItemCount / templatesPage.pageSize)} (${templatesPage.pageSize} items per page)\n`));
            templatesPage = await client.contentTypes.contentTypesList(undefined, undefined, templatesPage.pageIndex + 1, templatesPage.pageSize);
            results.push(...templatesPage.items);
            pagesRemaining = Math.ceil(templatesPage.totalItemCount / templatesPage.pageSize) - (templatesPage.pageIndex + 1);
        }
        if (cfg.debug)
            process.stdout.write(chalk.gray(`${figures.arrowRight} Fetched ${results.length} Content-Types from Optimizely CMS\n`));
        if (!fs.existsSync(basePath))
            fs.mkdirSync(basePath, { recursive: true });
        if (!fs.statSync(basePath).isDirectory()) {
            process.stderr.write(chalk.redBright(`${chalk.bold(figures.cross)} The components path ${basePath} is not a folder\n`));
            process.exit(1);
        }
        // Apply content type filters
        if (cfg.debug)
            process.stdout.write(chalk.gray(`${figures.arrowRight} Applying content type filters\n`));
        const contentTypes = results.filter(contentType => {
            if (contentType.source == 'system') {
                if (cfg.debug)
                    process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping ${contentType.displayName} (${contentType.key}) - Internal CMS type\n`));
                return false;
            }
            const baseType = contentType.baseType ?? 'default';
            if (excludeBaseTypes.includes(baseType)) {
                if (cfg.debug)
                    process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping ${contentType.displayName} (${contentType.key}) - Base type excluded\n`));
                return false;
            }
            if (excludeTypes.includes(contentType.key)) {
                if (cfg.debug)
                    process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping ${contentType.displayName} (${contentType.key}) - Content type excluded\n`));
                return false;
            }
            return true;
        });
        if (cfg.debug)
            process.stdout.write(chalk.gray(`${figures.arrowRight} Applied content type filters, reduced from ${results.length} to ${contentTypes.length} items\n`));
        // Create the type specific
        const updatedTypes = contentTypes.map(contentType => {
            const baseType = contentType.baseType ?? 'default';
            // Create the type folder
            const typePath = path.join(basePath, baseType, contentType.key);
            if (!fs.existsSync(typePath))
                fs.mkdirSync(typePath, { recursive: true });
            // Create fragments
            createGraphFragments(contentType, typePath, basePath, force, cfg, contentTypes);
            // Create component
            createComponent(contentType, typePath, force, cfg);
            return contentType.key;
        }).filter(x => x);
        createFactory(contentTypes, basePath, force, cfg);
        process.stdout.write(chalk.yellowBright(`${figures.arrowRight} Created/updated type definitions for ${updatedTypes.join(', ')}\n`));
        process.stdout.write(chalk.green(chalk.bold(figures.tick + " Done")) + "\n");
    }
};
function createFactory(contentTypes, basePath, force, cfg) {
    // Get the list of all base types
    const baseTypes = contentTypes.map(x => x.baseType).concat(['default']).filter((x, i, a) => x && !a.slice(0, i).includes(x)).sort();
    const baseTypeFactories = baseTypes.map(baseType => {
        // Get the list of inheriting types and return if it's empty
        const inheritingTypes = contentTypes.filter(x => x.baseType == baseType);
        if (inheritingTypes.length == 0)
            return;
        if (cfg.debug)
            process.stdout.write(chalk.gray(`${figures.arrowRight} Factory for ${ucFirst(baseType)} will contain these components: ${inheritingTypes.map(x => x.displayName ?? x.key).join(", ")}\n`));
        // Check the file presence and if we should overwrite
        const baseTypeFactory = path.join(basePath, baseType, 'index.ts');
        if (fs.existsSync(baseTypeFactory)) {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${figures.arrowRight} Overwriting ${ucFirst(baseType)} factory\n`));
        }
        // Build the actual factory
        const lines = [
            '// Auto generated dictionary',
            'import { ComponentTypeDictionary } from "@remkoj/optimizely-cms-react";'
        ];
        inheritingTypes.forEach(type => {
            lines.push(`import ${type.key} from "./${type.key}";`);
        });
        lines.push('');
        lines.push(`export const ${baseType}Dictionary : ComponentTypeDictionary = [`);
        inheritingTypes.forEach(type => {
            lines.push('    {', `        type: '${type.key}',`, `        component: ${type.key}`, '    },');
        });
        lines.push(']', '', `export default ${baseType}Dictionary`);
        fs.writeFileSync(baseTypeFactory, lines.join("\n"));
        return baseType;
    }).filter(x => x);
    const cmsFactoryFile = path.join(basePath, 'index.ts');
    if (fs.existsSync(cmsFactoryFile)) {
        if (cfg.debug)
            process.stdout.write(chalk.gray(`${figures.arrowRight} Overwriting CMS Components factory\n`));
    }
    const lines = [
        '// Auto generated dictionary',
        'import { ComponentTypeDictionary } from "@remkoj/optimizely-cms-react";'
    ];
    baseTypeFactories.forEach(type => {
        lines.push(`import ${type}Components from "./${type}";`);
    });
    lines.push('');
    baseTypeFactories.forEach(type => {
        lines.push(`prefixDictionaryEntries(${type}Components, '${ucFirst(type)}');`);
    });
    lines.push('');
    lines.push('export const cmsComponentDictionary : ComponentTypeDictionary = [');
    baseTypeFactories.forEach(type => {
        lines.push(`    ...${type}Components,`);
    });
    lines.push(']', '', `export default cmsComponentDictionary`, `function prefixDictionaryEntries(list: ComponentTypeDictionary, prefix: string) : ComponentTypeDictionary
{
    list.forEach((component, idx, dictionary) => {
        dictionary[idx].type = typeof component.type == 'string' ? prefix + "/" + component.type : [ prefix, ...component.type ]
    })
    return list
}`);
    fs.writeFileSync(cmsFactoryFile, lines.join("\n"));
}
function createComponent(contentType, typePath, force, cfg) {
    const componentFile = path.join(typePath, 'index.tsx');
    if (fs.existsSync(componentFile)) {
        if (force) {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${figures.arrowRight} Overwriting ${contentType.displayName} (${contentType.key}) component\n`));
        }
        else {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping ${contentType.displayName} (${contentType.key}) component - file already exists\n`));
            return undefined;
        }
    }
    const varName = `${contentType.key}${ucFirst(contentType.baseType ?? 'part')}`;
    const component = `import { CmsComponent } from "@remkoj/optimizely-cms-react";
import { ${contentType.key}DataFragmentDoc, type ${contentType.key}DataFragment } from "@/gql/graphql";

export const ${varName} : CmsComponent<${contentType.key}DataFragment> = ({ data }) => {
    const componentName = '${contentType.displayName}'
    const componentInfo = '${contentType.description ?? ''}'
    return <div className="mx-auto px-2 container">
        <div>{ componentName }</div>
        <div>{ componentInfo }</div>
        <pre className="w-full overflow-x-hidden font-mono text-sm">{ JSON.stringify(data, undefined, 4) }</pre>
    </div>
}
${varName}.getDataFragment = () => ['${contentType.key}Data', ${contentType.key}DataFragmentDoc]

export default ${varName}`;
    fs.writeFileSync(componentFile, component);
}
function ucFirst(current) {
    return current[0]?.toUpperCase() + current.substring(1);
}
function createGraphFragments(contentType, typePath, basePath, force, cfg, contentTypes) {
    const baseType = contentType.baseType ?? 'default';
    const baseQueryFile = path.join(typePath, `${contentType.key}.${baseType}.graphql`);
    if (fs.existsSync(baseQueryFile)) {
        if (force) {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${figures.arrowRight} Overwriting ${contentType.displayName} (${contentType.key}) base fragment\n`));
        }
        else {
            if (cfg.debug)
                process.stdout.write(chalk.gray(`${figures.arrowRight} Skipping ${contentType.displayName} (${contentType.key}) base fragment - file already exists\n`));
            return undefined;
        }
    }
    const { fragment, propertyTypes } = createInitialFragment(contentType);
    fs.writeFileSync(baseQueryFile, fragment);
    let dependencies = Array.isArray(propertyTypes) ? [...propertyTypes] : [];
    while (Array.isArray(dependencies) && dependencies.length > 0) {
        let newDependencies = [];
        dependencies.forEach(dep => {
            const propContentType = contentTypes.filter(x => x.key == dep[0])[0];
            if (!propContentType) {
                console.warn(`🟠 The content type ${dep[0]} has been referenced, but is not found in the Optimizely CMS instance`);
                return;
            }
            const propertyFragmentFile = path.join(basePath, propContentType.baseType ?? 'default', propContentType.key, `${propContentType.key}.property.graphql`);
            const propertyFragmentDir = path.dirname(propertyFragmentFile);
            if (!fs.existsSync(propertyFragmentDir))
                fs.mkdirSync(propertyFragmentDir, { recursive: true });
            if (!fs.existsSync(propertyFragmentFile) || force) {
                process.stdout.write(` - Writing property fragment: ${propContentType.displayName ?? propContentType.key}\n`);
                const propContentTypeInfo = createInitialFragment(propContentType, true);
                fs.writeFileSync(propertyFragmentFile, propContentTypeInfo.fragment);
                if (Array.isArray(propContentTypeInfo.propertyTypes))
                    newDependencies.push(...propContentTypeInfo.propertyTypes);
            }
        });
        dependencies = newDependencies;
    }
}
function createInitialFragment(contentType, forProperty = false) {
    const propertyTypes = [];
    const fragmentFields = [];
    const typeProps = contentType.properties ?? {};
    Object.getOwnPropertyNames(typeProps).forEach(propKey => {
        // Exclude system properties, which are not present in Optimizely Graph
        if (['experience', 'section'].includes(contentType.baseType) && ['AdditionalData', 'UnstructuredData', 'Layout'].includes(propKey))
            return;
        // Write the property
        switch (typeProps[propKey].type) {
            case "array":
                switch (typeProps[propKey].items.type) {
                    case "content":
                        if (contentType.baseType == 'page' || contentType.baseType == 'experience')
                            fragmentFields.push(`${propKey} { ...BlockData }`);
                        else
                            fragmentFields.push(`${propKey} { ...IContentListItem }`);
                        break;
                    case "component":
                        const componentType = typeProps[propKey].items.contentType;
                        switch (componentType) {
                            case 'link':
                                fragmentFields.push(`${propKey} { ...LinkItemData }`);
                                break;
                            default:
                                fragmentFields.push(`${propKey} { ...${componentType}Data }`);
                                break;
                        }
                        break;
                    default:
                        fragmentFields.push(`${propKey} { __typename }`);
                        break;
                }
                break;
            case "string":
                if (typeProps[propKey].format == "html")
                    fragmentFields.push(`${propKey} { json, html }`);
                else
                    fragmentFields.push(propKey);
                break;
            case "url":
                fragmentFields.push(`${propKey} { ...LinkData }`);
                break;
            case "contentReference":
                fragmentFields.push(`${propKey} { ...ReferenceData }`);
                break;
            case "component":
                const componentType = typeProps[propKey].contentType;
                fragmentFields.push(`${propKey} { ...${componentType}PropertyData }`);
                propertyTypes.push([componentType, true]);
                break;
            default:
                fragmentFields.push(propKey);
                break;
        }
    });
    if (fragmentFields.length == 0)
        fragmentFields.push('_metadata { key }');
    const tpl = `fragment ${contentType.key}${forProperty ? 'Property' : ''}Data on ${contentType.key}${forProperty ? 'Property' : ''} {
  ${fragmentFields.join("\n  ")}
}`;
    return {
        fragment: tpl,
        propertyTypes: propertyTypes.length == 0 ? null : propertyTypes
    };
}

const commands = [
    StylesPushCommand,
    StylesListCommand,
    StylesPullCommand,
    TypesPullCommand,
    NextJsCreateCommand
];

var version = "2.0.0-pre4";
var name = "opti-cms";
var APP = {
	version: version,
	name: name
};

// Create the application
prepare();
const app = createOptiCmsApp(APP.name, APP.version);
app.command(commands);
// Run the application
app.parse(process.argv.slice(2));
//# sourceMappingURL=index.js.map
