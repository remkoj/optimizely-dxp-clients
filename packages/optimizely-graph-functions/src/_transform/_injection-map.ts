import type  { FragmentDefinitionNode } from 'graphql'
import { VirtualLocation } from '../generator'

/** Metadata about a single fragment that is a candidate to be injected into an injection target. */
type TargetedFragementInfo = {
  name: string
  contentType: string
  definition: FragmentDefinitionNode
  location?: string
}

/**
 * Enhanced Map object specifically designed to hold
 * injection data. It adds some specific features to
 * transparantly handle deprecations as well as provide
 * some quality of life enhancements.
 */
export class InjectionMap extends Map<string, Array<TargetedFragementInfo>> {
  constructor(defaultKeys?: string[]) {
    super();
    for (const key of defaultKeys ?? []) {
      this.set(key, []);
    }
  }

  get(key: string): TargetedFragementInfo[] | undefined {
    return super.get(this.normalizeKey(key));
  }

  delete(key: string): boolean {
    return super.delete(this.normalizeKey(key));
  }

  has(key: string): boolean {
    return super.has(this.normalizeKey(key));
  }

  set(key: string, value: TargetedFragementInfo[]): this {
    return super.set(this.normalizeKey(key), value);
  }

  /**
   * Retrieve the combined set of all targeted fragements for the given
   * keys.
   * 
   * @param keys 
   * @returns 
   */
  getAll(keys: string[]) {
    return Array.isArray(keys) ? keys.flatMap((key) => this.get(key) ?? []) : []
  }

  /**
   * Append an item into the map
   * 
   * @param key   The injection target
   * @param item  The item to add for the target
   * @returns     Itself, to allow chaining
   */
  append(key: string, item: TargetedFragementInfo) {
    const currentList = this.get(key) ?? [];
    currentList.push(item);
    this.set(key, currentList);
    return this;
  }

  /**
   * Remove all empty items from the map
   */
  clean() {
    Array.from(this.keys()).forEach((key) => {
      if ((this.get(key)?.length ?? 0) === 0) this.delete(key);
    })
  }

  /**
   * Print a report
   * 
   * @param print Method to use for printing
   */
  report(print: (text: string) => void, prefix: string = '', verb: string = 'extended with') {
    Array.from(this.keys()).forEach((key) => {
      const items = this.get(key);
      print(`${ prefix }Spreads of ${ key } will be ${ verb } spreads of: ${ items?.map((i) => i.name).join(', ') ?? '' }`)
    })
  }

  private normalizeKey(key:string): string {
    return key === VirtualLocation.ContentTypeTarget.BlockData ? VirtualLocation.ContentTypeTarget.ComponentData : key
  }
}

export default InjectionMap
