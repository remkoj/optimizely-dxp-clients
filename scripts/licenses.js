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
        return pkgId.split(',').map(id => id.trim()).map(id => {
            const pkgName = id.startsWith('@') ? '@'+id.substring(1).split('@',2)[0] : id.split('@', 2)[0]
            const pkgSourceVersion = (id.startsWith('@') ? id.substring(1).split('@',2)[1] : id.split('@', 2)[1]) ?? ''
            const pkgSource = pkgSourceVersion.split(':')[0]
            return { name: pkgName, source: pkgSource, version: lockData[pkgId].version }
        })
    }).flat().filter((x, i, d) => !x.name.startsWith('_') && x.source.startsWith('npm') && d.slice(0,i).findIndex(v => v.name == x.name && v.version == x.version) == -1)

    process.stdout.write(`➡ Fetching additional data from NPM for ${ info.length } packages\n`)
    Promise.all(info.map((pkg, idx, data) => {
        const infoUrl = `https://registry.npmjs.com/${ pkg.name }`
        return fetch(infoUrl).then(response => { 
            if (!response.ok) {
                console.log(infoUrl)
                throw new Error(`HTTP Error ${ response.status }: ${ response.statusText }`)
            }
            return response.json()
        }).then(packageInfo => {
            data[idx].license = packageInfo.license
            data[idx].author = packageInfo.author
            return data[idx]
        })
    })).then(enrichedInfo => {
        process.stdout.write("➡ Writing dependencies file\n")
        function formatAuthor(authorInfo)
        {
            if (Array.isArray(authorInfo))
                return authorInfo.map(x => formatAuthor(x)).join(', ')
            if (!(authorInfo && authorInfo.name))
                return ''
            if (!authorInfo.email)
                return authorInfo.name
            return `[${ authorInfo.name } (${ authorInfo.email })](mailto:${ authorInfo.email })`
        }
        const licenses = []
        enrichedInfo.forEach(item => {
            const licenseCode = item.license ?? '*unspecified*'
            if (!licenses.includes(licenseCode)) licenses.push(licenseCode)
        })
        let packageList = `# Dependency disclosure
${ mainPkgName } has the following dependencies, resolving the full dependency tree

## License overview
The dependencies make use of these licenses:
| License | Package count |
| --- | --- |
${ licenses.sort().map(l => `| ${ l } | ${ enrichedInfo.filter(x => (x.license ?? '*unspecified*') == l ).length } |`).join("\n")}

## Package listing
| Package | Version | License | Author | Link |
| --- | --- | --- | --- | --- |
${ enrichedInfo.map(item => `| ${ item.name } | ${ item.version } | ${ item.license ?? '*unspecified*' } | ${ formatAuthor(item.author) } | [npm](https://www.npmjs.com/package/${ item.name }) |`).join("\n") }`
        fs.writeFile('DEPENDENCIES.md', packageList, () => {
            process.stdout.write("✔ Created dependencies file\n")
            process.exit(0)
        })
    }).catch(e => {
        process.stderr.write(`Error: ${ e.message }`)
        process.exit(1)
    })
})