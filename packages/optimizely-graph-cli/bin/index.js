#!/usr/bin/env node
/**
 * Frontend Utility providing helpers for common tasks when building a Vercel
 * hosted, Next.JS based website that uses Optimizely Graph as content 
 * repository.
 * 
 * License: Apache 2
 * Copyright (c) 2023-2024 - Remko Jantzen
 */

import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';
import * as path from 'node:path';
import path__default from 'node:path';
import yargs from 'yargs';
import { readEnvironmentVariables, applyConfigDefaults, validateConfig } from '@remkoj/optimizely-graph-client/config';
import createAdminApi, { isApiError } from '@remkoj/optimizely-graph-client/admin';
import chalk from 'chalk';
import figures from 'figures';
import Table from 'cli-table3';
import ChannelRepository from '@remkoj/optimizely-graph-client/channels';
import fs from 'node:fs';

function processEnvFile(suffix = "") {
    const envVars = dotenv.config({
        path: path.resolve(process.cwd(), `.env${suffix}`)
    });
    dotenvExpand.expand(envVars);
}
const envName = process.env.OPTI_BUILD_ENV ?? process.env.NODE_ENV ?? 'development';
processEnvFile(`.${envName}.local`);
processEnvFile(`.${envName}`);
processEnvFile('.local');
processEnvFile();

function isDemanded(value) {
    if (value == undefined || value == null)
        return true;
    switch (typeof (value)) {
        case 'string':
            return value == "";
    }
    return false;
}

function createCliApp(scriptName, version, epilogue) {
    const config = readEnvironmentVariables();
    return yargs(process.argv)
        .scriptName(scriptName)
        .version(version ?? "development")
        .usage('$0 <cmd> [args]')
        .option("dxp_url", { alias: "du", description: "Optimizely CMS URL", string: true, type: "string", demandOption: isDemanded(config.dxp_url), default: config.dxp_url })
        .option("deploy_domain", { alias: "dd", description: "Frontend domain", string: true, type: "string", demandOption: isDemanded(config.deploy_domain), default: config.deploy_domain })
        .option('app_key', { alias: "ak", description: "Content Graph App Key", string: true, type: "string", demandOption: isDemanded(config.app_key), default: config.app_key })
        .option('secret', { alias: "s", description: "Content Graph Secret", string: true, type: "string", demandOption: isDemanded(config.secret), default: config.secret })
        .option('single_key', { alias: "sk", description: "Content Graph Single Key", string: true, type: "string", demandOption: isDemanded(config.single_key), default: config.single_key })
        .option('gateway', { alias: "g", description: "Content Graph Gateway", string: true, type: "string", demandOption: isDemanded(config.gateway), default: config.gateway })
        .option('verbose', { description: "Enable query logging", boolean: true, type: 'boolean', demandOption: false, default: config.query_log })
        .demandCommand(1, 1)
        .showHelpOnFail(true)
        .epilogue(`Copyright Remko Jantzen - 2023-${(new Date(Date.now())).getFullYear()}`)
        .help();
}
function getArgsConfig(args) {
    const config = applyConfigDefaults({
        dxp_url: args.dxp_url,
        deploy_domain: args.deploy_domain,
        app_key: args.app_key,
        secret: args.secret,
        single_key: args.single_key,
        gateway: args.gateway,
        query_log: args.verbose
    });
    if (!validateConfig(config, false))
        throw new Error("Invalid Content-Graph connection details provided");
    return config;
}
function getFrontendURL(config) {
    const host = config.deploy_domain ?? 'http://localhost:3000';
    const hostname = host.split(":")[0];
    const scheme = hostname == 'localhost' || hostname.endsWith(".local") ? 'http:' : 'https:';
    return new URL(`${scheme}//${host}/`);
}

const publishToVercelModule$2 = {
    command: ['webhook:create [path] [verb]', 'wc [path] [verb]', 'register [path] [verb]'],
    handler: async (args) => {
        const cgConfig = getArgsConfig(args);
        const frontendUrl = getFrontendURL(cgConfig);
        const hookPath = args.path ?? '/';
        const verb = args.verb ?? 'POST';
        const token = args.publish_token;
        const webhookTarget = new URL(hookPath, frontendUrl);
        if (token)
            webhookTarget.searchParams.set('token', token);
        process.stdout.write(`${chalk.yellow(chalk.bold(figures.arrowRight))} Registering webhook target: ${chalk.yellow(webhookTarget.href)}\n`);
        if (webhookTarget.hostname == 'localhost') {
            process.stderr.write(chalk.redBright(chalk.bold(figures.cross) + " Cannot register a localhost Site URL with Content Graph") + "\n");
            process.exitCode = 1;
            return;
        }
        if (!cgConfig.app_key || !cgConfig.secret)
            throw new Error("Make sure both the Optimizely Graph App Key & Secret have been defined");
        const adminApi = createAdminApi(cgConfig);
        try {
            const currentHooks = await adminApi.webhooks.listWebhookHandler();
            if (currentHooks.some(x => x.request.url == webhookTarget.href)) {
                process.stdout.write("\n" + chalk.greenBright(chalk.bold(figures.tick) + " Webhook already registered, no action needed") + "\n");
                process.exitCode = 0;
                return;
            }
            function urlWithoutSearch(url) {
                const newURL = new URL(url.href);
                for (const key in newURL.searchParams.keys)
                    newURL.searchParams.delete(key);
                return newURL;
            }
            const targetWithoutQuery = urlWithoutSearch(webhookTarget);
            await Promise.allSettled(currentHooks.map(async (hook) => {
                const hookUrl = urlWithoutSearch(new URL(hook.request.url));
                if (hookUrl.href == targetWithoutQuery.href) {
                    process.stdout.write(`${chalk.yellow(chalk.bold(figures.arrowRight))} Removing webhook with incorrect query parameters: ${chalk.yellow(hookUrl.href)}`);
                    try {
                        await adminApi.webhooks.deleteWebhookHandler(hook.id);
                        return true;
                    }
                    catch {
                        return false;
                    }
                }
                return true;
            }));
            await adminApi.webhooks.createWebhookHandler({
                request: {
                    url: webhookTarget.href,
                    method: verb
                }
            });
            process.stdout.write("\n" + chalk.greenBright(`${chalk.bold(figures.tick)} ${webhookTarget.href} has been added as Webhook recipient to Optimizely Graph`) + "\n");
        }
        catch (e) {
            if (isApiError(e)) {
                process.stderr.write(chalk.redBright(`${chalk.bold(figures.cross)} Optimizely Graph returned an error: HTTP ${e.status}: ${e.statusText}`) + "\n");
                if (args.verbose)
                    console.error(chalk.redBright(JSON.stringify(e.body, undefined, 4)));
            }
            else {
                process.stderr.write(chalk.redBright(`${chalk.bold(figures.cross)} Optimizely Graph returned an error`) + "\n");
            }
            process.exitCode = 1;
            return;
        }
    },
    aliases: [],
    describe: "Adds a webhook to Optimizely Graph that invokes /api/content/publish on every publish in Optimizely Graph",
    builder: (args) => {
        const defaultToken = readEnvironmentVariables().publish;
        const hasDefaultToken = typeof (defaultToken) == 'string' && defaultToken.length > 0;
        args.positional('path', { type: "string", describe: "The frontend route to invoke to publish", default: "/api/content/publish", demandOption: false });
        args.positional('verb', { type: "string", describe: "The HTTP verb to be used when sending the webhook", default: "POST", demandOption: false });
        args.option("publish_token", { alias: "pt", description: "Publishing token", string: true, type: "string", demandOption: !hasDefaultToken, default: defaultToken });
        return args;
    }
};

const publishToVercelModule$1 = {
    command: ['webhook:delete [path]', 'wd [path]', 'unregister [path]'],
    handler: async (args) => {
        const cgConfig = getArgsConfig(args);
        const hookPath = args.path ?? '/';
        const token = args.publish_token;
        const token_id = args.token_id;
        if (!cgConfig.app_key || !cgConfig.secret)
            throw new Error("Make sure both the Optimizely Graph App Key & Secret have been defined");
        const adminApi = createAdminApi(cgConfig);
        if (typeof (token_id) == 'string' && token_id.length > 24) {
            process.stdout.write(`Removing Webhook with ID: ${token_id}\n`);
            try {
                await adminApi.webhooks.deleteWebhookHandler(token_id);
            }
            catch (e) {
                if (isApiError(e)) {
                    process.stderr.write(`!! Optimizely Graph returned an error: HTTP ${e.status}: ${e.statusText}\n`);
                    if (args.verbose)
                        console.error(e.body);
                    process.exitCode = 1;
                    return;
                }
                else {
                    process.stderr.write(`!! Optimizely Graph returned an error\n`);
                }
            }
            process.stdout.write(`Removed WebHook with ID ${token_id} from ContentGraph\n`);
            return;
        }
        const frontendUrl = getFrontendURL(cgConfig);
        const webhookTarget = new URL(hookPath, frontendUrl);
        if (token)
            webhookTarget.searchParams.set('token', token);
        process.stdout.write(`Removing webhook target: ${webhookTarget.href}\n`);
        if (webhookTarget.hostname == 'localhost') {
            process.stderr.write("!! Cannot register a localhost Site URL with Content Graph\n");
            process.exitCode = 1;
            return;
        }
        try {
            const currentHooks = await adminApi.webhooks.listWebhookHandler();
            const hooks = currentHooks.filter(x => x.request.url == webhookTarget.href);
            if (!hooks || hooks.length == 0) {
                process.stdout.write("Webhook not found, not removing anything\n");
                process.exitCode = 0;
                return;
            }
            await Promise.all(hooks.map(async (hook) => {
                const hookId = hook.id;
                process.stdout.write(`Removing Webhook with ID: ${hookId}\n`);
                await adminApi.webhooks.deleteWebhookHandler(hookId).then(() => process.stdout.write(`Removed WebHook with ID ${hookId} from ContentGraph\n`));
                return true;
            }));
        }
        catch (e) {
            if (isApiError(e)) {
                process.stderr.write(`!! Optimizely Graph returned an error: HTTP ${e.status}: ${e.statusText}\n`);
                if (args.verbose)
                    console.error(e.body);
                process.exitCode = 1;
                return;
            }
            else {
                process.stderr.write(`!! Optimizely Graph returned an error\n`);
            }
        }
        process.stdout.write("Done\n");
    },
    aliases: [],
    describe: "Removes a webhook from ContentGraph that invokes /api/content/publish on every publish in ContentGraph",
    builder: (args) => {
        const defaultToken = process.env.FRONTEND_PUBLISH_TOKEN || undefined;
        const hasDefaultToken = typeof (defaultToken) == 'string' && defaultToken.length > 0;
        args.positional('path', { type: "string", describe: "The frontend route to invoke to publish", default: "/api/content/publish", demandOption: false });
        args.option("publish_token", { alias: "pt", description: "Publishing token", string: true, type: "string", demandOption: !hasDefaultToken, default: defaultToken });
        args.option("token_id", { alias: "ti", description: "If set, removes this webhook only", string: true, type: "string", demandOption: false, default: undefined });
        return args;
    }
};

const publishToVercelModule = {
    command: ['webhook:list', 'wl', 'list'],
    handler: async (args) => {
        const cgConfig = getArgsConfig(args);
        if (!cgConfig.app_key || !cgConfig.secret)
            throw new Error("Make sure both the Optimizely Graph App Key & Secret have been defined");
        const adminApi = createAdminApi(cgConfig);
        try {
            const currentHooks = await adminApi.webhooks.listWebhookHandler();
            const hooks = new Table({
                head: [chalk.yellow(chalk.bold("ID")), chalk.yellow(chalk.bold("Method")), chalk.yellow(chalk.bold("Url"))],
                colWidths: [38, 8, 100]
            });
            currentHooks.forEach(x => {
                hooks.push([x.id, x.request.method, x.request.url]);
            });
            process.stdout.write(hooks.toString() + "\n");
            process.stdout.write(chalk.green(chalk.bold(figures.tick + " Done")) + "\n");
        }
        catch (e) {
            if (isApiError(e)) {
                process.stderr.write(chalk.redBright(`${chalk.bold(figures.cross)} Optimizely Graph returned an error: HTTP ${e.status}: ${e.statusText}`) + "\n");
                if (args.verbose)
                    console.error(chalk.redBright(JSON.stringify(e.body, undefined, 4)));
            }
            else {
                process.stderr.write(chalk.redBright(`${chalk.bold(figures.cross)} Optimizely Graph returned an unknown error`) + "\n");
                if (args.verbose)
                    console.error(chalk.redBright(e));
            }
            process.exitCode = 1;
            return;
        }
    },
    aliases: [],
    describe: "List all webhooks in ContentGraph",
};

const DEFAULT_CONFIG_FILE = "src/site-config.ts";
const createSiteConfigModule = {
    command: ['config:create [file_path]', 'cc [file_path]', 'site-config [file_path]'],
    handler: async (args) => {
        const cgConfig = getArgsConfig(args);
        if (!cgConfig.app_key || !cgConfig.secret)
            throw new Error("Make sure both the Optimizely Graph App Key & Secret have been defined");
        const siteHost = getFrontendURL(cgConfig).host;
        const targetFile = args.file_path ?? DEFAULT_CONFIG_FILE;
        process.stdout.write(`${chalk.yellow(chalk.bold(figures.arrowRight))} Generating configuration file for website with domain: ${chalk.yellow(siteHost)}\n`);
        const channelRepo = new ChannelRepository(cgConfig);
        let channel = null;
        try {
            channel = await channelRepo.getByDomain(siteHost, false);
        }
        catch (e) {
            if (args.verbose ?? false) {
                process.stderr.write(chalk.redBright(chalk.bold(figures.cross) + " " + (new String(e))) + "\n");
            }
            process.stdout.write(chalk.redBright(chalk.bold(figures.cross) + " Failed loading website data"));
            process.exitCode = 1;
            return;
        }
        if (!channel) {
            try {
                process.stdout.write(`${chalk.red(chalk.bold(figures.bullet))} Domain not found, falling back to match-all domain: ${chalk.yellow("*")}\n`);
                channel = await channelRepo.getByDomain(siteHost, true);
            }
            catch (e) {
                if (args.verbose ?? false) {
                    process.stderr.write(chalk.redBright(chalk.bold(figures.cross) + " " + (new String(e))) + "\n");
                }
                process.stdout.write(chalk.redBright(chalk.bold(figures.cross) + " Failed loading website data"));
                process.exitCode = 1;
                return;
            }
        }
        if (!channel || channel == null) {
            process.stdout.write(chalk.redBright(`${chalk.bold(figures.cross)} No website defintion found for host ${siteHost}`) + "\n");
            process.exitCode = 1;
            return;
        }
        process.stdout.write(`${chalk.yellow(chalk.bold(figures.arrowRight))} Loaded website data, generating TypeScript code.\n`);
        const [siteDefinition, cms_url] = channel.asDataObject();
        const code = [
            '/**',
            ' * This file has been automatically generated, do not update manually',
            ' *',
            ' * Use yarn opti-graph config:create [file_path] to re-generate this file',
            ' */',
            'import { ChannelDefinition, type ChannelDefinitionData } from "@remkoj/optimizely-graph-client"',
            '',
            `const generated_data : ChannelDefinitionData = ${JSON.stringify(siteDefinition)};`,
            '',
            `export const SiteConfig = new ChannelDefinition(generated_data, "${cms_url}")`,
            'export default SiteConfig'
        ];
        const filePath = path__default.join(process.cwd(), targetFile);
        process.stdout.write(`${chalk.yellow(chalk.bold(figures.arrowRight))} Writing code to: ${chalk.yellow(filePath)}\n`);
        fs.writeFileSync(filePath, code.join("\n"));
        process.stdout.write(chalk.greenBright(`${chalk.bold(figures.tick)} Done`) + "\n");
    },
    builder: (args) => {
        args.positional("file_path", { description: "The target file path", string: true, type: "string", demandOption: false, default: DEFAULT_CONFIG_FILE });
        return args;
    },
    aliases: [],
    describe: "Generate a static site configuration file",
};

const GraphSourceListCommand = {
    command: ['source:list', 'sl'],
    handler: async (args) => {
        const cgConfig = getArgsConfig(args);
        if (!cgConfig.app_key || !cgConfig.secret)
            throw new Error("Make sure both the Optimizely Graph App Key & Secret have been defined");
        const adminApi = createAdminApi(cgConfig);
        try {
            const currentSources = (await adminApi.definitionV3.getContentV3SourceHandler());
            const sources = new Table({
                head: [chalk.yellow(chalk.bold("ID")), chalk.yellow(chalk.bold("Label")), chalk.yellow(chalk.bold("Languages"))],
                colWidths: [10, 50, 50]
            });
            for (const sourceDetails of currentSources) {
                sources.push([sourceDetails.id, sourceDetails.label, sourceDetails.languages.join(', ')]);
            }
            process.stdout.write(sources.toString() + "\n");
            process.stdout.write(chalk.green(chalk.bold(figures.tick + " Done")) + "\n");
        }
        catch (e) {
            if (isApiError(e)) {
                process.stderr.write(chalk.redBright(`${chalk.bold(figures.cross)} Optimizely Graph returned an error: HTTP ${e.status}: ${e.statusText}`) + "\n");
                if (args.verbose)
                    console.error(chalk.redBright(JSON.stringify(e.body, undefined, 4)));
            }
            else {
                process.stderr.write(chalk.redBright(`${chalk.bold(figures.cross)} Optimizely Graph returned an unknown error`) + "\n");
                if (args.verbose)
                    console.error(chalk.redBright(e));
            }
            process.exitCode = 1;
            return;
        }
    },
    aliases: [],
    describe: "List all content sources in Optimizely Graph",
};

const GraphSourceClearCommand = {
    command: ['source:clear [sourceId]', 'sc [sourceId]'],
    handler: async (args) => {
        const cgConfig = getArgsConfig(args);
        if (!cgConfig.app_key || !cgConfig.secret)
            throw new Error("Make sure both the Optimizely Graph App Key & Secret have been defined");
        const sourceId = args.sourceId;
        if (!sourceId) {
            process.stderr.write(chalk.redBright(`${chalk.bold(figures.cross)} Missing source ID, invoke with --help for more details`) + "\n");
            return process.exit(1);
        }
        const adminApi = createAdminApi(cgConfig);
        try {
            process.stdout.write(`${chalk.yellow(chalk.bold(figures.arrowRight))} Loading content source: ${chalk.yellow(sourceId)}\n`);
            const contentSource = (await adminApi.definitionV3.getContentV3SourceHandler(sourceId))[0];
            if (!(contentSource && contentSource.id == sourceId)) {
                throw new Error("An incorrect content source was returned by Optimizely Graph");
            }
            process.stdout.write(`${chalk.yellow(chalk.bold(figures.arrowRight))} Removing all content from ${chalk.yellow(contentSource.label)} (Languages: ${chalk.yellow(contentSource.languages.join(', '))})\n`);
            await adminApi.definitionV2.deleteContentV2DataHandler(sourceId, contentSource.languages);
            process.stdout.write(chalk.green(chalk.bold(figures.tick + " Done")) + "\n");
        }
        catch (e) {
            if (isApiError(e)) {
                if (e.status == 404) {
                    process.stderr.write(chalk.redBright(`${chalk.bold(figures.cross)} Optimizely Graph Source with ID ${sourceId} does not exist`) + "\n");
                }
                else {
                    process.stderr.write(chalk.redBright(`${chalk.bold(figures.cross)} Optimizely Graph returned an error: HTTP ${e.status}: ${e.statusText}`) + "\n");
                }
                if (args.verbose)
                    console.error(chalk.redBright(JSON.stringify(e.body, undefined, 4)));
            }
            else {
                process.stderr.write(chalk.redBright(`${chalk.bold(figures.cross)} Optimizely Graph returned an unknown error`) + "\n");
                if (args.verbose)
                    console.error(chalk.redBright(e));
            }
            process.exitCode = 1;
            return;
        }
    },
    aliases: [],
    builder: (args) => {
        args.positional('sourceId', { type: "string", describe: "The source to clear", demandOption: true });
        return args;
    },
    describe: "Remove all data for the specified source",
};

const GraphSourceRemoveCommand = {
    command: ['source:delete [sourceId]', 'sd [sourceId]'],
    handler: async (args) => {
        const cgConfig = getArgsConfig(args);
        if (!cgConfig.app_key || !cgConfig.secret)
            throw new Error("Make sure both the Optimizely Graph App Key & Secret have been defined");
        const sourceId = args.sourceId;
        if (!sourceId) {
            process.stderr.write(chalk.redBright(`${chalk.bold(figures.cross)} Missing source ID, invoke with --help for more details`) + "\n");
            return process.exit(1);
        }
        const adminApi = createAdminApi(cgConfig);
        try {
            process.stdout.write(`${chalk.yellow(chalk.bold(figures.arrowRight))} Loading content source: ${chalk.yellow(sourceId)}\n`);
            const contentSource = (await adminApi.definitionV3.getContentV3SourceHandler(sourceId))[0];
            if (!(contentSource && contentSource.id == sourceId)) {
                throw new Error("An incorrect content source was returned by Optimizely Graph");
            }
            process.stdout.write(`${chalk.yellow(chalk.bold(figures.arrowRight))} Removing all content from ${chalk.yellow(contentSource.label)} (Languages: ${chalk.yellow(contentSource.languages.join(', '))})\n`);
            await adminApi.definitionV2.deleteContentV2DataHandler(sourceId, contentSource.languages);
            process.stdout.write(`${chalk.yellow(chalk.bold(figures.arrowRight))} Removing source ${chalk.yellow(contentSource.label)}\n`);
            await adminApi.definitionV3.deleteContentV3SourceHandler(sourceId);
            process.stdout.write(chalk.green(chalk.bold(figures.tick + " Done")) + "\n");
        }
        catch (e) {
            if (isApiError(e)) {
                if (e.status == 404) {
                    process.stderr.write(chalk.redBright(`${chalk.bold(figures.cross)} Optimizely Graph Source with ID ${sourceId} does not exist`) + "\n");
                }
                else {
                    process.stderr.write(chalk.redBright(`${chalk.bold(figures.cross)} Optimizely Graph returned an error: HTTP ${e.status}: ${e.statusText}`) + "\n");
                }
                if (args.verbose)
                    console.error(chalk.redBright(JSON.stringify(e.body, undefined, 4)));
            }
            else {
                process.stderr.write(chalk.redBright(`${chalk.bold(figures.cross)} Optimizely Graph returned an unknown error`) + "\n");
                if (args.verbose)
                    console.error(chalk.redBright(e));
            }
            process.exitCode = 1;
            return;
        }
    },
    aliases: [],
    builder: (args) => {
        args.positional('sourceId', { type: "string", describe: "The source to clear", demandOption: true });
        return args;
    },
    describe: "Remove all data for the specified source",
};

var SourceModules = /*#__PURE__*/Object.freeze({
    __proto__: null,
    GraphSourceClearCommand: GraphSourceClearCommand,
    GraphSourceListCommand: GraphSourceListCommand,
    GraphSourceRemoveCommand: GraphSourceRemoveCommand
});

const modules = [publishToVercelModule$2, publishToVercelModule$1, publishToVercelModule, createSiteConfigModule];
for (const moduleName of Object.getOwnPropertyNames(SourceModules)) {
    modules.push(SourceModules[moduleName]);
}

var APP;
(function (APP) {
    APP["Script"] = "opti-graph";
    APP["Version"] = "1.0.3";
})(APP || (APP = {}));
const app = createCliApp(APP.Script, APP.Version);
app.command(modules);
app.parse(process.argv.slice(2));
//# sourceMappingURL=index.js.map
