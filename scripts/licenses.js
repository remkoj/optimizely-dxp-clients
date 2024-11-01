const fs = require('node:fs')
const YAML = require('yaml')

if (!fs.existsSync('yarn.lock')) {
    process.stdout.write("⚠ No Yarn lockfile found\n")
    process.exit(0)
}
if (!fs.existsSync('package.json')) {
    process.stdout.write("⚠ No Package definition found\n")
    process.exit(0)
}

const mainPkgInfo = JSON.parse(fs.readFileSync('package.json', {encoding: 'utf-8'}))
const mainPkgName = mainPkgInfo.name

process.stdout.write("➡ Reading Yarn lockfile\n")
fs.readFile('yarn.lock', {
    encoding: 'utf-8'
}, (err, data) => {
    if (err) {
        process.stderr.write(`‼ ${ err.message }\n`)
        process.exit(1)
    }

    const lockData = YAML.parse(data)

    process.stdout.write("➡ Extracting dependencies\n")
    const info = Object.getOwnPropertyNames(lockData).map(pkgId => {
        return lockData[pkgId].resolution
    }).filter((x, i, d)=>x && d.findIndex(v => v == x) == i).sort().map(id => {
        const pkgName = id.startsWith('@') ? '@'+id.substring(1).split('@',2)[0] : id.split('@', 2)[0]
        const pkgSourceVersion = (id.startsWith('@') ? id.substring(1).split('@',2)[1] : id.split('@', 2)[1]) ?? ''
        const [pkgSource,pkgVersion] = pkgSourceVersion.split(':',2)
        return { name: pkgName, source: pkgSource, version: pkgVersion }
    }).filter(x => x.source != 'workspace')
   
    process.stdout.write(`➡ Fetching additional data from NPM for ${ info.length } packages\n`)
    batchedTransform(info, async pkg => {
        if (pkg.source != 'npm')
            return pkg
        const infoUrl = `https://registry.npmjs.com/${ pkg.name }/${pkg.version}`
        const response = await fetch(infoUrl)
        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}: ${response.statusText} for ${ infoUrl }`)
        }
        const packageInfo = await response.json()
        return {
            ...pkg,
            license: packageInfo.license,
            author: packageInfo.author,
            maintainers: packageInfo.maintainers,
            homepage: packageInfo.homepage
        }
    }, 20).then(enrichedInfo => {
        if (enrichedInfo.hasError) {
            process.stderr.write(`❌ Some transformations failed\n`)
            enrichedInfo.errors.forEach(e => {
                process.stderr.write(`  - ${ e.message }\n`)
            })
        }
        process.stdout.write("➡ Writing dependencies file\n")
        /**
         * Format author information 
         * 
         * @param {string | {name: string, email?:string} | Array<string | {name: string, email?:string}>} authorInfo 
         * @returns {string}    The formatted author information
         */
        function formatAuthor(authorInfo)
        {
            const maxAuthors = 5
            if (Array.isArray(authorInfo)) {
                const authorList = authorInfo.map(x => formatAuthor(x))
                if (authorList.length > maxAuthors) {
                    return authorList.slice(0, maxAuthors).join(', ') + " et al."
                } else {
                    return authorList.join(', ')
                }
            }
            if (typeof(authorInfo) == 'string' && authorInfo.length > 0)
                return authorInfo
            if (!(authorInfo && authorInfo.name))
                return ''
            if (!authorInfo.email)
                return authorInfo.name
            return `[${ authorInfo.name } (${ authorInfo.email })](mailto:${ authorInfo.email })`
        }
        const licenses = []
        enrichedInfo.data.forEach(item => {
            const licenseCode = item.license ?? '*unspecified*'
            if (!licenses.includes(licenseCode)) licenses.push(licenseCode)
        })
        let packageList = `# Dependency disclosure
The package ${ mainPkgName } has the following dependencies, which are software packages that are required to run this software. These packages are only referenced and will be resolved, downloaded and installed by your dependency manager.

This overview and list is automatically generated from the dependencies used in developing of these packages, not necessarily in running the packages.

## Package listing
| Package | Version | License | Author | Maintainers | Link |
| --- | --- | --- | --- | --- | --- |
${ enrichedInfo.data.map(item => `| ${ item.homepage ? `[${ item.name}](${item.homepage})` : item.name } | ${ item.version } | ${ item.license ?? '*unspecified*' } | ${ formatAuthor(item.author) } | ${ formatAuthor(item.maintainers) } | [npm](https://www.npmjs.com/package/${ item.name }) |`).join("\n") }

## License usage overview
The dependencies make use of these licenses:
| License | Package count |
| --- | --- |
${ licenses.sort().map(l => `| ${ l } | ${ enrichedInfo.data.filter(x => (x.license ?? '*unspecified*') == l ).length } |`).join("\n")}
`
        fs.writeFile('DEPENDENCIES.md', packageList, () => {
            process.stdout.write("✔ Created dependencies file\n")
        })
    }).catch(e => {
        process.stderr.write(`Error: ${ e.message }`)
        process.exit(1)
    })
})

/**
 * Run a batched transformation process, usefull when the resources needed
 * for a transformation are limited and the "Promise.all(input.map(transformer))"
 * approach doesn't work.
 * 
 * @param {Array<any>} input 
 * @param {(item: any, index: number, array: Array<any>) => Promise<any>} transformer 
 * @param {number} batchSize 
 * @returns {Promise<Array<any>>}
 */
async function batchedTransform(input, transformer, batchSize = 10)
{
    // Input validation
    if (!Array.isArray(input))
        throw new Error("Input must be an array")
    if (batchSize < 1)
        throw new Error("Batch size must be 1 or higher")
    
    // Split into batches
    const batches = []
    const batchCount = Math.ceil(input.length / batchSize)
    for (batchNr = 0; batchNr < batchCount; batchNr++)
    {
        const firstItem = batchNr * batchSize
        const lastItem = Math.min((batchNr + 1) * batchSize, input.length)
        batches.push(input.slice(firstItem, lastItem))
    }

    let batchId = 0

    /**
     * Batch processing
     * 
     * @param {Array<any>} batch 
     * @param {(item: any, index: number, array: Array<any>) => Promise<any>} transformer 
     * @param {Array<Array<any>>} remainingBatches 
     * @returns {Promise<PromiseSettledResult<any>[]>}
     */
    async function runBatch(batch, transformer, remainingBatches) 
    {
        const myBatchId = ++batchId
        console.log("⚪ Starting batch " + myBatchId + " of " + batchCount)
        if (!Array.isArray(remainingBatches))
            throw new Error("Remaining batches must be an array")

        const myResult = await Promise.allSettled(batch.map(transformer))
        const nextBatch = remainingBatches.shift()
        if (!nextBatch)
            return myResult
        const nextResult = await runBatch(nextBatch, transformer, remainingBatches)
        myResult.push(...nextResult)
        return myResult
    }

    // Run the actual batches
    const firstBatch = batches.shift()
    if (!firstBatch)
        return []
    const results = await runBatch(firstBatch, transformer, batches)
    const values = results.filter(x => x.status == 'fulfilled').map(x => x.value)
    const reasons = results.filter(x => x.status == 'rejected').map(x => x.reason)
    return {
        data: values,
        errors: reasons,
        hasError: reasons.length > 0
    }
    
}

