import { getArgsConfig, getFrontendURL } from '../app.js';
import ChannelRepository from '@remkoj/optimizely-graph-client/channels';
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import figures from 'figures';
const DEFAULT_CONFIG_FILE = "src/site-config.ts";
export const createSiteConfigModule = {
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
        const filePath = path.join(process.cwd(), targetFile);
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
export default createSiteConfigModule;
