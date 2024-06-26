import { getArgsConfig, getFrontendURL } from '../app.js';
import createAdminApi, { isApiError } from '@remkoj/optimizely-graph-client/admin';
import { readEnvironmentVariables as getEnvConfig } from "@remkoj/optimizely-graph-client/config";
import chalk from 'chalk';
import figures from 'figures';
export const publishToVercelModule = {
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
        const defaultToken = getEnvConfig().publish;
        const hasDefaultToken = typeof (defaultToken) == 'string' && defaultToken.length > 0;
        args.positional('path', { type: "string", describe: "The frontend route to invoke to publish", default: "/api/content/publish", demandOption: false });
        args.positional('verb', { type: "string", describe: "The HTTP verb to be used when sending the webhook", default: "POST", demandOption: false });
        args.option("publish_token", { alias: "pt", description: "Publishing token", string: true, type: "string", demandOption: !hasDefaultToken, default: defaultToken });
        return args;
    }
};
export default publishToVercelModule;
