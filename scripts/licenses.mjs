import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import YAML from 'yaml'

/**
 * Marker used in the "Dev" column for development-only dependencies
 */
const DEV_MARKER = '🔧'

/**
 * Marker used in the "Conflict" column for dependencies with a license that conflicts
 * with releasing the package that references them under Apache-2.0
 */
const CONFLICT_MARKER = '⚠️'

/**
 * Text used for dependencies without license information
 */
const UNSPECIFIED_LICENSE = '*unspecified*'

/**
 * License identifiers (SPDX, case-insensitive) that conflict with a release under Apache-2.0:
 * strong and network copyleft (GPL, LGPL, AGPL), SSPL, the Business Source License (BUSL-*, the
 * SPDX identifier BSL-1.0 is the permissive Boost license and is not matched), non-commercial
 * and Commons Clause style licenses and licenses that are not specified or are custom.
 */
const CONFLICTING_LICENSES = [
  /^(?:A|L)?GPL(?:-|$)/i,
  /^SSPL(?:-|$)/i,
  /^BUSL(?:-|$)/i,
  /^BSL-1\.1$/i,
  /^CC-BY(?:-[A-Z]+)*-NC(?:-|$)/i,
  /^Commons-?Clause$/i,
  /NON-?COMMERCIAL/i,
  /^LicenseRef-/i,
  /^(?:UNLICENSED|NONE|UNKNOWN|CUSTOM|PROPRIETARY)$/i
]

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
  await applyPackageExtensions(graph, readPackageExtensions())
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
  const transitiveNodes = [...graph.nodes.values()].filter(n => n.source != 'workspace' && !n.isTwin && !directNodes.has(n))
  const unreachable = transitiveNodes.filter(n => !allNodes.has(n) && !(graph.twins.get(n) ?? []).length && !n.isTwin)
  if (unreachable.length > 0) {
    process.stdout.write(`⚠ Not reachable from any workspace package, marked as development-only: ${ unreachable.map(n => n.id).join(', ') }\n`)
  }

  const listedNodes = [...directNodes, ...transitiveNodes]
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
      license: normalizeLicense(packageInfo),
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
  const hasConflict = node => isConflictingLicense(getInfo(node).license)

  process.stdout.write("➡ Writing dependencies file\n")
  const licenses = []
  listedNodes.forEach(node => {
    const licenseCode = getInfo(node).license ?? UNSPECIFIED_LICENSE
    if (!licenses.includes(licenseCode)) licenses.push(licenseCode)
  })

  /**
   * Sort the packages for a table: conflicting first, then runtime before development-only,
   * then by name (case-insensitive, ascending) and version (ascending)
   *
   * @param {Array<{ node: any, dev: boolean }>} items
   * @returns {Array<{ node: any, dev: boolean }>}    A sorted copy of the items
   */
  function sortItems(items)
  {
    return [...items].sort((a, b) => {
      const infoA = getInfo(a.node)
      const infoB = getInfo(b.node)
      return Number(hasConflict(b.node)) - Number(hasConflict(a.node))
        || Number(a.dev) - Number(b.dev)
        || infoA.name.localeCompare(infoB.name, 'en', { sensitivity: 'base' })
        || String(infoA.version).localeCompare(String(infoB.version), 'en', { numeric: true })
    })
  }

  /**
   * Render the table for a list of packages. The Conflict column is only included when at
   * least one of the packages conflicts.
   *
   * @param {Array<{ node: any, dev: boolean }>} items
   * @returns {string}
   */
  function renderTable(items)
  {
    const showConflict = items.some(({ node }) => hasConflict(node))
    const header = `| Package | Dev |${ showConflict ? ' Conflict |' : '' } Version | License | Author | Maintainers | Link |
| --- | :---: |${ showConflict ? ' :---: |' : '' } --- | --- | --- | --- | --- |`
    const rows = sortItems(items).map(({ node, dev }) => {
      const item = getInfo(node)
      return `| ${ item.homepage ? `[${ item.name}](${item.homepage})` : item.name } | ${ dev ? DEV_MARKER : '' } |${ showConflict ? ` ${ hasConflict(node) ? CONFLICT_MARKER : '' } |` : '' } ${ item.version } | ${ item.license ?? UNSPECIFIED_LICENSE } | ${ formatAuthor(item.author) } | ${ formatAuthor(item.maintainers) } | [npm](https://www.npmjs.com/package/${ item.name }) |`
    })
    return `${ header }\n${ rows.join("\n") }`
  }

  /**
   * Render the count line of a section, the conflict count is only included when there are conflicts
   *
   * @param {Array<{ node: any, dev: boolean }>} items
   * @returns {string}
   */
  function renderCounts(items)
  {
    const conflictCount = items.filter(({ node }) => hasConflict(node)).length
    return `Dependencies: ${ items.length } (development-only: ${ items.filter(i => i.dev).length }${ conflictCount > 0 ? `, ${ CONFLICT_MARKER } conflicting with Apache-2.0: ${ conflictCount }` : '' })`
  }

  const perPackageSections = workspaces.map(ws => {
    return `### ${ ws.name }${ ws.version ? ` (${ ws.version })` : '' }
${ ws.description ? `${ ws.description }\n\n` : '' }${ renderCounts(ws.dependencies) }

${ ws.dependencies.length > 0 ? renderTable(ws.dependencies) : '*No dependencies*' }
`
  }).join("\n")

  const transitiveItems = transitiveNodes.map(node => ({ node, dev: isDevOnly(node) }))
  const conflictingNodes = listedNodes.filter(hasConflict)

  const licenseRows = licenses.map(l => ({
    license: l,
    conflict: isConflictingLicense(l == UNSPECIFIED_LICENSE ? undefined : l),
    count: listedNodes.filter(x => (getInfo(x).license ?? UNSPECIFIED_LICENSE) == l).length
  })).sort((a, b) => Number(b.conflict) - Number(a.conflict) || a.license.localeCompare(b.license, 'en', { sensitivity: 'base' }))
  const showLicenseConflict = licenseRows.some(row => row.conflict)
  const licenseTable = `| License |${ showLicenseConflict ? ' Conflict |' : '' } Package count |
| --- |${ showLicenseConflict ? ' :---: |' : '' } --- |
${ licenseRows.map(row => `| ${ row.license } |${ showLicenseConflict ? ` ${ row.conflict ? CONFLICT_MARKER : '' } |` : '' } ${ row.count } |`).join("\n") }`

  const slugs = new Set()
  const sectionTitles = [
    ...workspaces.map(ws => `${ ws.name }${ ws.version ? ` (${ ws.version })` : '' }`),
    'Remaining dependencies (through hierarchy)',
    'License usage overview'
  ]
  const [ packageTitles, otherTitles ] = [ sectionTitles.slice(0, workspaces.length), sectionTitles.slice(workspaces.length) ]
  const contents = [
    `- [Dependencies per package](#${ slugify('Dependencies per package', slugs) })`,
    ...packageTitles.map(title => `  - [${ title }](#${ slugify(title, slugs) })`),
    ...otherTitles.map(title => `- [${ title }](#${ slugify(title, slugs) })`)
  ].join("\n")

  const packageList = `# Dependency disclosure
The dependencies of the packages in ${ mainPkgName } are only referenced: your dependency manager resolves, downloads and installs them.

**Contents**
${ contents }

Generated from the dependencies used to develop these packages, not necessarily to run them. Packages of this repository are not listed. Versions are those resolved in the lockfile. Rows are sorted conflicting first, then runtime before development-only, then by name and version.

- ${ DEV_MARKER } *Dev*: development-only. For a package's own dependencies: only declared in \`devDependencies\`. For the remaining dependencies: only reachable through a \`devDependencies\` entry. Peer dependencies are only listed when also a \`devDependencies\` entry.
- ${ CONFLICT_MARKER } *Conflict*: the license conflicts with releasing the referencing package under Apache-2.0: GPL (also with exceptions), LGPL, AGPL, SSPL, BUSL, non-commercial or Commons Clause licenses, and unknown, missing or custom licenses (\`UNLICENSED\`, \`SEE LICENSE IN\`). Weak copyleft (MPL, EPL, CDDL) and permissive licenses are not marked. \`A OR B\` and \`A AND B\` are only marked when none of the licenses is acceptable. This is an automated indication based on npm license metadata, not legal advice. ${ conflictingNodes.length > 0 ? `${ conflictingNodes.length } of ${ listedNodes.length } dependencies are marked; the column is only shown in tables that contain one.` : 'No conflicts were found, so the column is not shown.' }

## Dependencies per package
${ perPackageSections }
## Remaining dependencies (through hierarchy)
Not declared by the packages above, but imported through their dependencies. ${ renderCounts(transitiveItems) }

${ renderTable(transitiveItems) }

## License usage overview
${ licenseTable }
`
  fs.writeFileSync('DEPENDENCIES.md', packageList)
  conflictingNodes.forEach(node => {
    const referencedBy = workspaces.filter(ws => reachable(graph, ws.dependencies.map(d => d.node)).has(node)).map(ws => ws.name)
    process.stdout.write(`${ CONFLICT_MARKER } ${ node.name }@${ node.version } (${ getInfo(node).license ?? UNSPECIFIED_LICENSE }) referenced by ${ referencedBy.join(', ') }\n`)
  })
  process.stdout.write(`✔ Created dependencies file (${ workspaces.length } packages, ${ directNodes.size } direct and ${ transitiveItems.length } remaining dependencies, ${ conflictingNodes.length } marked ${ CONFLICT_MARKER })\n`)
} catch (e) {
  process.stderr.write(`Error: ${ e.message }\n`)
  process.exit(1)
}

/**
 * Create the anchor GitHub generates for a heading: lowercase, characters other than letters,
 * numbers, `_`, `-` and spaces removed, spaces replaced by `-` and a numeric suffix for duplicates
 *
 * @param {string} title    The heading text
 * @param {Set<string>} used    The anchors already used in the document, which is updated
 * @returns {string}    The anchor, without the leading `#`
 */
function slugify(title, used)
{
  const base = title.toLowerCase().replace(/[^\p{L}\p{N}\p{M}_\- ]/gu, '').replace(/ /g, '-')
  let slug = base
  for (let counter = 1; used.has(slug); counter++)
    slug = `${ base }-${ counter }`
  used.add(slug)
  return slug
}

/**
 * Get the license of a package as text from its npm metadata, supporting the current
 * `license` string and the legacy `license` object and `license`/`licenses` arrays
 *
 * @param {{ license?: any, licenses?: any }} packageInfo   The package metadata
 * @returns {string | undefined}    The license (SPDX) expression, `undefined` when not specified.
 *      Multiple licenses are alternatives, so they are combined with `OR`.
 */
function normalizeLicense(packageInfo)
{
  /**
   * @param {any} value
   * @returns {string | undefined}
   */
  const toText = value => {
    if (Array.isArray(value)) {
      const texts = value.map(toText).filter(x => x)
      return texts.length > 1 ? `(${ texts.join(' OR ') })` : texts[0]
    }
    const text = typeof(value) == 'string' ? value : value?.type
    return typeof(text) == 'string' && text.trim().length > 0 ? text.trim() : undefined
  }
  return toText(packageInfo.license) ?? toText(packageInfo.licenses)
}

/**
 * Determine if a license (SPDX) expression conflicts with releasing a package that
 * references it under Apache-2.0, see `CONFLICTING_LICENSES` for the used policy.
 *
 * @param {string | undefined} license  The license expression, `undefined` when not specified
 * @returns {boolean}   `true` when there is a conflict. For `A OR B` and `A AND B` only when
 *      none of the licenses is acceptable (multiple licenses do not conflict when at least one is compatible). Expressions that
 *      cannot be parsed conflict, as these cannot be assessed.
 */
function isConflictingLicense(license)
{
  if (!license || /^SEE LICENSE IN/i.test(license.trim()))
    return true
  const tokens = license.match(/\(|\)|[^\s()]+/g) ?? []
  let position = 0

  const parseOr = () => {
    let conflicts = parseAnd()
    while (tokens[position]?.toUpperCase() == 'OR') {
      position++
      const next = parseAnd()
      conflicts = conflicts && next
    }
    return conflicts
  }
  const parseAnd = () => {
    let conflicts = parseTerm()
    while (tokens[position]?.toUpperCase() == 'AND') {
      position++
      const next = parseTerm()
      conflicts = conflicts && next
    }
    return conflicts
  }
  const parseTerm = () => {
    const token = tokens[position++]
    if (token == '(') {
      const conflicts = parseOr()
      if (tokens[position++] != ')')
        throw new Error('Unbalanced parentheses')
      return conflicts
    }
    if (!token || token == ')' || ['AND', 'OR', 'WITH'].includes(token.toUpperCase()))
      throw new Error('Unexpected token')
    const identifier = token.replace(/\+$/, '')
    // An exception (WITH) does not make a GPL license acceptable, as that needs a case-by-case assessment
    if (tokens[position]?.toUpperCase() == 'WITH')
      position += 2
    return CONFLICTING_LICENSES.some(pattern => pattern.test(identifier)) || isUnknownIdentifier(identifier)
  }

  try {
    const conflicts = parseOr()
    return position < tokens.length ? true : conflicts
  } catch {
    return true
  }
}

/**
 * Check if an identifier is not a valid license identifier, which means that it can not be assessed
 *
 * @param {string} identifier
 * @returns {boolean}
 */
function isUnknownIdentifier(identifier)
{
  return !/^[A-Za-z0-9][A-Za-z0-9.-]*$/.test(identifier)
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
 * Format the description of a package.json for use as a single line of Markdown text
 *
 * @param {any} description     The `description` value of the package.json
 * @returns {string | undefined}    The description with whitespace collapsed and Markdown/HTML syntax
 *      escaped, `undefined` when there is no description
 */
function formatDescription(description)
{
  if (typeof(description) != 'string')
    return undefined
  const text = description.replace(/\s+/g, ' ').trim()
  if (text.length == 0)
    return undefined
  return text.replace(/[\\`*_{}[\]()<>|~&]/g, '\\$&').replace(/^([#+-]|\d+[.)])/, '\\$1')
}

/**
 * Read the workspace packages from the graph, with the dependencies they declare in their package.json
 *
 * @param {ReturnType<typeof buildGraph>} graph
 * @returns {Array<{ name: string, version: string | undefined, description: string | undefined, dependencies: Array<{ node: any, dev: boolean }> }>}
 *      The workspace packages (workspace root last), with their Markdown-safe description (`undefined`
 *      when the package.json has none) and their sorted direct dependencies. A dependency
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
      .sort((a, b) => a.node.name.localeCompare(b.node.name) || String(a.node.version).localeCompare(String(b.node.version)))
    return { name: pkgInfo.name ?? node.name, version: pkgInfo.version, description: formatDescription(pkgInfo.description), dependencies, isRoot: location == '.' }
  }).sort((a, b) => Number(a.isRoot) - Number(b.isRoot) || a.name.localeCompare(b.name))
}

/**
 * Find the package a dependency descriptor resolves to
 *
 * @param {ReturnType<typeof buildGraph>} graph
 * @param {string} descriptor   The descriptor (`name@range`). A range without protocol is also
 *      looked up as `npm:` range, as descriptors added by `packageExtensions` are not always normalized.
 * @returns {any}   The package, `undefined` when the descriptor is not in the lockfile
 */
function findDescriptor(graph, descriptor)
{
  const separator = descriptor.indexOf('@', 1)
  const name = descriptor.substring(0, separator)
  const range = descriptor.substring(separator + 1)
  return graph.byDescriptor.get(descriptor)
    ?? (range.includes(':') ? undefined : graph.byDescriptor.get(`${ name }@npm:${ range }`))
    ?? graph.overrides.get(name)
}

/**
 * Read the `packageExtensions` from the Yarn configuration
 *
 * @param {string} [file]   The Yarn configuration file
 * @returns {Record<string, any>}   The package extensions by `name@range`, empty when there are none
 *      or when the configuration cannot be read
 */
function readPackageExtensions(file = '.yarnrc.yml')
{
  try {
    if (!fs.existsSync(file))
      return {}
    const extensions = YAML.parse(fs.readFileSync(file, { encoding: 'utf-8' }))?.packageExtensions
    return extensions && typeof(extensions) == 'object' ? extensions : {}
  } catch (e) {
    process.stdout.write(`⚠ Unable to read the packageExtensions from ${ file }: ${ e.message }\n`)
    return {}
  }
}

/**
 * Add the dependencies that Yarn `packageExtensions` add to third-party packages to the graph. Yarn
 * applies these when installing and does not store them in the `dependencies` of the lockfile entry,
 * only the descriptors of the added dependencies are in the lockfile. Peer dependencies (and their
 * meta data) are not followed by the graph, so only `dependencies` and `optionalDependencies` are applied.
 * Extensions that cannot be applied are reported and skipped.
 *
 * @param {ReturnType<typeof buildGraph>} graph    The graph, which is updated
 * @param {Record<string, any>} extensions  The package extensions by `name@range`
 * @returns {Promise<void>}
 */
async function applyPackageExtensions(graph, extensions)
{
  const entries = Object.entries(extensions)
  if (entries.length == 0)
    return
  /** @type {((version: string, range: string) => boolean) | undefined} */
  let satisfies
  try {
    satisfies = (await import('semver')).default.satisfies
  } catch {
    satisfies = undefined
  }
  entries.forEach(([key, extension]) => {
    const separator = key.indexOf('@', 1)
    const name = separator > 0 ? key.substring(0, separator) : key
    const range = (separator > 0 ? key.substring(separator + 1) : '*').replace(/^npm:/, '')
    const added = Object.entries({ ...extension?.optionalDependencies, ...extension?.dependencies }).map(([dependency, dependencyRange]) => {
      const normalized = String(dependencyRange).includes(':') ? String(dependencyRange) : `npm:${ dependencyRange }`
      return `${ dependency }@${ normalized }`
    })
    const matches = [...graph.nodes.values()].filter(node => {
      if (node.name != name || node.source != 'npm' || !node.version)
        return false
      if (range == '*' || range == '')
        return true
      if (satisfies)
        return satisfies(node.version, range)
      return node.version == range
    })
    if (matches.length == 0) {
      process.stdout.write(`⚠ The packageExtension ${ key } does not match a package in the lockfile\n`)
      return
    }
    added.forEach(descriptor => {
      if (!findDescriptor(graph, descriptor))
        process.stdout.write(`⚠ The packageExtension ${ key } adds ${ descriptor }, which is not in the lockfile\n`)
    })
    matches.forEach(node => {
      added.filter(descriptor => !node.dependencies.includes(descriptor)).forEach(descriptor => node.dependencies.push(descriptor))
    })
  })
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
      const dependencyNode = findDescriptor(graph, descriptor)
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
