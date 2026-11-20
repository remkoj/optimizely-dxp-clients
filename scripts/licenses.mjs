import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import YAML from 'yaml'

/**
 * Marker used in the "Dev" column for development-only dependencies
 */
const DEV_MARKER = '🔧'

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

try {
  process.stdout.write("➡ Reading Yarn lockfile\n")
  const lockData = YAML.parse(fs.readFileSync('yarn.lock', {encoding: 'utf-8'}))

  process.stdout.write("➡ Building dependency graph\n")
  const graph = buildGraph(lockData, mainPkgInfo.resolutions)
  const workspaces = readWorkspaces(graph)

  // Dependencies that are installed for runtime use. Anything that can be reached
  // from here is NOT development-only.
  // Peer dependencies are not followed, as they are provided by the consumer of a
  // package. They are only listed (as development-only) when a workspace package
  // also declares them as devDependency, because only then they are installed.
  const runtimeRoots = workspaces.flatMap(ws => ws.dependencies.filter(d => !d.dev).map(d => d.node))
  const devRoots = workspaces.flatMap(ws => ws.dependencies.filter(d => d.dev).map(d => d.node))
  const runtimeNodes = reachable(graph, runtimeRoots)
  const allNodes = reachable(graph, [...runtimeRoots, ...devRoots])
  const isDevOnly = node => !runtimeNodes.has(node)

  // Packages that are declared directly by one of the workspace packages
  const directNodes = new Set(workspaces.flatMap(ws => ws.dependencies.map(d => d.node)))
  const transitiveNodes = [...graph.nodes.values()].filter(n => n.source != 'workspace' && !directNodes.has(n))
  const unreachable = transitiveNodes.filter(n => !allNodes.has(n) && !(graph.twins.get(n) ?? []).length && !n.isTwin)
  if (unreachable.length > 0) {
    process.stdout.write(`⚠ Not reachable from any workspace package, marked as development-only: ${ unreachable.map(n => n.id).join(', ') }\n`)
  }

  const listedNodes = [...graph.nodes.values()].filter(n => n.source != 'workspace' && (directNodes.has(n) || transitiveNodes.includes(n)))
  process.stdout.write(`➡ Fetching additional data from NPM for ${ listedNodes.length } packages\n`)
  const enriched = await batchedTransform(listedNodes, async pkg => {
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
  }, 20)
  if (enriched.hasError) {
    process.stderr.write(`❌ Some transformations failed\n`)
    enriched.errors.forEach(e => {
      process.stderr.write(`  - ${ e.message }\n`)
    })
  }
  const metadata = new Map(enriched.data.map(item => [item.id, item]))
  const getInfo = node => metadata.get(node.id) ?? node

  process.stdout.write("➡ Writing dependencies file\n")
  const licenses = []
  listedNodes.forEach(node => {
    const licenseCode = getInfo(node).license ?? '*unspecified*'
    if (!licenses.includes(licenseCode)) licenses.push(licenseCode)
  })

  /**
   * Render the table rows for a list of packages
   *
   * @param {Array<{ node: any, dev: boolean }>} items
   * @returns {string}
   */
  function renderRows(items)
  {
    return items.map(({ node, dev }) => {
      const item = getInfo(node)
      return `| ${ item.homepage ? `[${ item.name}](${item.homepage})` : item.name } | ${ dev ? DEV_MARKER : '' } | ${ item.version } | ${ item.license ?? '*unspecified*' } | ${ formatAuthor(item.author) } | ${ formatAuthor(item.maintainers) } | [npm](https://www.npmjs.com/package/${ item.name }) |`
    }).join("\n")
  }
  const tableHeader = `| Package | Dev | Version | License | Author | Maintainers | Link |
| --- | :---: | --- | --- | --- | --- | --- |`

  const perPackageSections = workspaces.map(ws => {
    const devCount = ws.dependencies.filter(d => d.dev).length
    return `### ${ ws.name }${ ws.version ? ` (${ ws.version })` : '' }
Dependencies: ${ ws.dependencies.length } (development-only: ${ devCount })

${ ws.dependencies.length > 0 ? `${ tableHeader }\n${ renderRows(ws.dependencies) }` : '*No dependencies*' }
`
  }).join("\n")

  const transitiveItems = transitiveNodes.map(node => ({ node, dev: isDevOnly(node) }))
  const transitiveDevCount = transitiveItems.filter(i => i.dev).length

  const packageList = `# Dependency disclosure
The package ${ mainPkgName } has the following dependencies, which are software packages that are required to run this software. These packages are only referenced and will be resolved, downloaded and installed by your dependency manager.

This overview and list is automatically generated from the dependencies used in developing of these packages, not necessarily in running the packages.

The overview first lists the dependencies that each package of this repository declares itself. After that, all remaining dependencies are listed, which are imported through the hierarchy of dependencies. Dependencies on other packages of this repository are not listed. The version is the version that is resolved in the lockfile.

Legend: ${ DEV_MARKER } in the *Dev* column indicates a development-only dependency. For the direct dependencies of a package, these are the packages the package only declares as \`devDependencies\`. For the remaining dependencies, these are the packages that can only be reached through a \`devDependencies\` entry; a package with at least one path from a runtime dependency is not development-only. Peer dependencies are only listed when the package also declares them as \`devDependencies\`, as these are the only ones that are installed for the package.

## Dependencies per package
${ perPackageSections }
## Remaining dependencies (through hierarchy)
These packages are not declared by one of the packages above, but are imported through the hierarchy of the dependencies listed above. Dependencies: ${ transitiveItems.length } (development-only: ${ transitiveDevCount })

${ tableHeader }
${ renderRows(transitiveItems) }

## License usage overview
The dependencies listed above make use of these licenses:
| License | Package count |
| --- | --- |
${ licenses.sort().map(l => `| ${ l } | ${ listedNodes.filter(x => (getInfo(x).license ?? '*unspecified*') == l ).length } |`).join("\n")}
`
  fs.writeFileSync('DEPENDENCIES.md', packageList)
  process.stdout.write(`✔ Created dependencies file (${ workspaces.length } packages, ${ directNodes.size } direct and ${ transitiveItems.length } remaining dependencies)\n`)
} catch (e) {
  process.stderr.write(`Error: ${ e.message }\n`)
  process.exit(1)
}

/**
 * Parse a Yarn resolution into its parts
 *
 * @param {string} id   The resolution, e.g. `@scope/name@npm:1.2.3`
 * @returns {{ name: string, source: string, version: string }}
 */
function parseResolution(id)
{
  const pkgName = id.startsWith('@') ? '@'+id.substring(1).split('@',2)[0] : id.split('@', 2)[0]
  const pkgSourceVersion = (id.startsWith('@') ? id.substring(1).split('@',2)[1] : id.split('@', 2)[1]) ?? ''
  const [pkgSource,pkgVersion] = pkgSourceVersion.split(':',2)
  return { name: pkgName, source: pkgSource, version: pkgVersion }
}

/**
 * Build the dependency graph from the Yarn lockfile
 *
 * @param {Record<string, any>} lockData    The parsed lockfile
 * @param {Record<string, string>} [resolutions]    The `resolutions` of the root package.json. Yarn rewrites
 *      the descriptors of overridden packages in the lockfile, so the dependents still refer to the original
 *      descriptor. Only plain package names (`name`) with a version range are supported.
 * @returns {{ nodes: Map<string, any>, byDescriptor: Map<string, any>, twins: Map<any, Array<any>>, overrides: Map<string, any> }}
 *      The nodes by resolution, the nodes by the descriptors (`name@range`) that resolve to them, the
 *      patched variants (twins) of a node and the nodes that override all ranges of a package name. The
 *      edges (`dependencies`) of a node are the descriptors of its dependencies, which excludes peer dependencies.
 */
function buildGraph(lockData, resolutions = {})
{
  const nodes = new Map()
  const byDescriptor = new Map()
  Object.getOwnPropertyNames(lockData).forEach(key => {
    const entry = lockData[key]
    if (!entry || !entry.resolution)
      return
    if (!nodes.has(entry.resolution)) {
      nodes.set(entry.resolution, {
        id: entry.resolution,
        ...parseResolution(entry.resolution),
        dependencies: Object.entries(entry.dependencies ?? {}).map(([name, range]) => `${ name }@${ range }`)
      })
    }
    const node = nodes.get(entry.resolution)
    key.split(',').map(d => d.trim()).forEach(d => byDescriptor.set(d, node))
  })

  // A patched package is installed instead of the original package, but is
  // referenced in the lockfile by the descriptor of the original package.
  const twins = new Map()
  byDescriptor.forEach((node, descriptor) => {
    const patchOf = /@patch:(.+?)(?:#|$)/.exec(descriptor)
    const original = patchOf ? byDescriptor.get(decodeURIComponent(patchOf[1])) : undefined
    if (original && original != node) {
      twins.set(original, [...(twins.get(original) ?? []).filter(t => t != node), node])
      node.isTwin = true
    }
  })
  const overrides = new Map()
  Object.entries(resolutions).forEach(([name, range]) => {
    const node = byDescriptor.get(`${ name }@npm:${ range }`)
    if (node)
      overrides.set(name, node)
  })
  return { nodes, byDescriptor, twins, overrides }
}

/**
 * Read the workspace packages from the graph, with the dependencies they declare in their package.json
 *
 * @param {ReturnType<typeof buildGraph>} graph
 * @returns {Array<{ name: string, version: string | undefined, dependencies: Array<{ node: any, dev: boolean }> }>}
 *      The workspace packages (workspace root last), with their sorted direct dependencies. A dependency
 *      is `dev` when it is only declared in the `devDependencies`.
 */
function readWorkspaces(graph)
{
  const workspaceNodes = [...graph.nodes.values()].filter(n => n.source == 'workspace')
  return workspaceNodes.map(node => {
    const location = node.id.substring(node.id.indexOf('@workspace:') + '@workspace:'.length)
    const pkgInfo = JSON.parse(fs.readFileSync(path.join(location, 'package.json'), { encoding: 'utf-8' }))
    const runtimeDeps = { ...pkgInfo.optionalDependencies, ...pkgInfo.dependencies }
    const devDeps = Object.fromEntries(Object.entries(pkgInfo.devDependencies ?? {}).filter(([name]) => !(name in runtimeDeps)))
    const declared = [
      ...Object.entries(runtimeDeps).map(([name, range]) => ({ name, range, dev: false })),
      ...Object.entries(devDeps).map(([name, range]) => ({ name, range, dev: true }))
    ]
    const dependencies = declared.map(({ name, range, dev }) => {
      const dependencyNode = [range, `npm:${ range }`, `workspace:${ range }`].map(r => graph.byDescriptor.get(`${ name }@${ r }`)).find(n => n) ?? graph.overrides.get(name)
      if (!dependencyNode) {
        process.stdout.write(`⚠ ${ pkgInfo.name }: Unable to resolve ${ name }@${ range } in the lockfile\n`)
        return undefined
      }
      return { node: dependencyNode, dev }
    }).filter(x => x && x.node.source != 'workspace')
      .sort((a, b) => a.node.name.localeCompare(b.node.name) || a.node.version.localeCompare(b.node.version))
    return { name: pkgInfo.name ?? node.name, version: pkgInfo.version, dependencies, isRoot: location == '.' }
  }).sort((a, b) => Number(a.isRoot) - Number(b.isRoot) || a.name.localeCompare(b.name))
}

/**
 * Find all packages that can be reached from the given packages
 *
 * @param {ReturnType<typeof buildGraph>} graph
 * @param {Array<any>} roots    The packages to start from
 * @returns {Set<any>}          The roots and all packages that are (indirectly) required by them
 */
function reachable(graph, roots)
{
  const seen = new Set()
  const queue = [...roots]
  while (queue.length > 0) {
    const node = queue.pop()
    if (seen.has(node))
      continue
    seen.add(node)
    // The dependencies of a workspace package are covered by their own entry
    // in the package listing, so the devDependencies must not be followed.
    if (node.source == 'workspace')
      continue
    queue.push(...(graph.twins.get(node) ?? []))
    node.dependencies.forEach(descriptor => {
      const dependencyNode = graph.byDescriptor.get(descriptor) ?? graph.overrides.get(parseResolution(descriptor).name)
      if (dependencyNode)
        queue.push(dependencyNode)
    })
  }
  return seen
}

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
  for (let batchNr = 0; batchNr < batchCount; batchNr++)
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
