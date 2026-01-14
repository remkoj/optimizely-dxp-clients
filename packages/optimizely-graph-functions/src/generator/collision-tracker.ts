import path from 'node:path';
import fs from 'node:fs'

/**
 * Tracker for all properties, indexed by property name, then type
 * for a list of all ContentTypes. This uses a lock file to remember
 * any collision resolutions done by the code generation.
 */
export class PropertyCollisionTracker extends Map<string,string> {
  private _cwd: string | undefined;
  private _ready: boolean = false;

  public set cwd(newValue: string | undefined)
  {
    if (newValue !== this._cwd) {
      this._cwd = newValue
      super.clear();
      if (newValue === undefined) {
        this._ready = false;
        return
      }
      
      this.readLock();
      this._ready = true;
    }
  }

  public get cwd(): string | undefined {
    return this._cwd
  }

  public constructor(cwd?: string)
  {
    super()
    this.cwd = cwd
  }

  private ensureReady()
  {
    if (!this._ready)
      throw new Error("NOT READY")
  }

  private updateLock()
  {
    if (!this._cwd)
      throw new Error("Working directory unknown");
    const file = path.join(this._cwd, '.opti-props.lock')
    const data: {propertyName: string, propertyType: string}[] = [];
    for ( const [entryKey,entryValue] of super.entries())
      data.push({ propertyName: entryKey, propertyType: entryValue })
    const raw = JSON.stringify(data, undefined, '  ')
    fs.writeFileSync(file, raw, { encoding: 'utf-8' })
  }

  private readLock()
  {
    try {
      if (!this._cwd)
        throw new Error("Working directory unknown");
      const file = path.join(this._cwd, '.opti-props.lock')
      const raw = fs.readFileSync(file, { encoding: 'utf-8'})
      const data = raw.length > 0 ? JSON.parse(raw) : []
      if (!Array.isArray(data))
        throw new Error(`Invalid lock file at ${ file }`)
      for (const itm of data.filter(this.isMapData))
        super.set(itm.propertyName, itm.propertyType)
    } catch (e: any) {
      if (e.code === 'ENOENT')
        return []
      throw e
    }
  }

  private isMapData(v: any): v is {propertyName: string, propertyType: string}
  {
    if (typeof(v)!=='object' || v === null)
      return false;
    return typeof(v.propertyName) === 'string' && typeof(v.propertyType) ==='string'
  }

  has(key: string): boolean {
    this.ensureReady()
    return super.has(key)
  }

  set(key: string, value: string): this {
    this.ensureReady()
    const cv = super.get(key)
    if (cv !== value) {
      super.set(key,value)
      this.updateLock()
    }
    return this
  }

  get(key: string): string | undefined {
    this.ensureReady()
    return super.get(key)
  }

  delete(key: string): boolean {
    this.ensureReady()
    const res = super.delete(key)
    this.updateLock()
    return res
  }

  clear(): void {
    this.ensureReady()
    super.clear()
    this.updateLock()
  }
}

export default PropertyCollisionTracker
