import Cms13Fragments from './fragments.cms13'
import Cms13Queries from './queries.cms13'

/**
 * The list of standard properties
 * 
 * @deprecated  Should not be used from @remkoj/optimizely-graph-functions, as it's a development only package
 */
export const IContentDataProps = ["contentType","id","locale","path","__typename"]

/**
 * The standard (rawSDL) fragments for Optimizely CMS 13
 * 
 * @deprecated  Not intended to be used outside of the @remkoj/optimizely-graph-functions package
 */
export const fragments = Cms13Fragments

/**
 * The standard (rawSDL) fragments for Optimizely CMS 13
 * 
 * @deprecated  Not intended to be used outside of the @remkoj/optimizely-graph-functions package
 */
export const queries = Cms13Queries