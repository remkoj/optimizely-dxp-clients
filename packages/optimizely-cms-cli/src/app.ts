import { CmsIntegrationApiOptions, getCmsIntegrationApiConfigFromEnvironment } from '@remkoj/optimizely-cms-api'
import yargs from 'yargs'
import { OptiCmsApp } from './types.js'

export function createOptiCmsApp(scriptName: string, version?: string, epilogue?: string) : OptiCmsApp
{
    let config : CmsIntegrationApiOptions;
    try {
        config = getCmsIntegrationApiConfigFromEnvironment()
    } catch {
        config = {
            base: new URL('https://example.cms.optimizely.com')
        }
    }
    return yargs(process.argv)
        .scriptName(scriptName)
        .version(version ?? "development")
        .usage('$0 <cmd> [args]')
        .option("path", { alias: "p", description: "Application root folder", string: true, type: "string", demandOption: false, default: process.cwd() })
        .option("components", { alias: "c", description: "Path to components folder", string: true, type: "string", demandOption: false, default: "./src/components/cms" })
        .option("cms_url", { alias: "cu", description: "Optimizely CMS URL", string: true, type: "string", demandOption: isDemanded(config.base), default: config.base, coerce: (val) => new URL(val)})
        .option("client_id", { alias: "ci", description: "API Client ID", string: true, type: "string", demandOption: isDemanded(config.clientId), default: config.clientId })
        .option('client_secret', { alias: "cs", description: "API Client Secrent", string: true, type: "string", demandOption: isDemanded(config.clientSecret), default: config.clientSecret })
        .option('user_id', { alias: "uid", description: "Impersonate user id", string: true, type: "string", demandOption: false, default: config.actAs })
        .option('verbose', { description: "Enable logging", boolean: true, type: 'boolean', demandOption: false, default: config.debug })
        .demandCommand(1,1)
        .showHelpOnFail(true)
        .epilogue(epilogue ?? `Copyright Remko Jantzen - 2023-${ (new Date(Date.now())).getFullYear() }`)
        .help()
}

export default createOptiCmsApp

function isDemanded(value: any)
{
    if (value == undefined || value == null)
        return true
    switch (typeof(value))
    {
        case 'string':
            return value == ""
    }
    return false
}