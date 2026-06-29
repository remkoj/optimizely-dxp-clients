'use client';
import { useEffect, useState } from "react";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INTEGER = /^\d+$/;
const LOCALE = /^[a-z]{2}(-[a-z]{2})?$/i;
const STORAGE_KEY = 'preview-link-form';

export default function PreviewLink() {
  const [key, setKey] = useState('');
  const [version, setVersion] = useState('');
  const [locale, setLocale] = useState('');
  const [ctx, setCtx] = useState<'edit' | 'preview'>('edit');
  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [loaded, setLoaded] = useState(false);

  // Restore previously entered values on mount.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (typeof data.key === 'string') setKey(data.key);
        if (typeof data.version === 'string') setVersion(data.version);
        if (typeof data.locale === 'string') setLocale(data.locale);
        if (data.ctx === 'edit' || data.ctx === 'preview') setCtx(data.ctx);
        if (data.mode === 'single' || data.mode === 'multi') setMode(data.mode);
      }
    } catch {
      // Ignore storage / parse errors (e.g. private mode).
    }
    setLoaded(true);
  }, []);

  // Persist values as they change, but only once the initial restore has
  // committed — otherwise the empty mount state would overwrite stored values.
  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ key, version, locale, ctx, mode }));
    } catch {
      // Ignore storage errors.
    }
  }, [loaded, key, version, locale, ctx, mode]);

  const keyValid = UUID_V4.test(key);
  const versionValid = INTEGER.test(version);
  const localeValid = LOCALE.test(locale);
  const allValid = keyValid && versionValid && localeValid;

  const params = new URLSearchParams({
    key: key.replace(/-/g, ''),
    ver: version,
    loc: locale,
    ctx,
    preview_token: 'use-hmac',
  });
  const href = `/${mode}/preview?${params.toString()}`;

  function fieldClass(value: string, valid: boolean) {
    if (!value) return 'preview-input';
    return valid ? 'preview-input preview-input--valid' : 'preview-input preview-input--invalid';
  }

  return (
    <section className="preview-section">
      <style>{`
        .preview-section {
          margin-top: 2.5rem;
          padding: 1.5rem;
          background: color-mix(in srgb, var(--foreground) 4%, var(--background));
          border: 1px solid color-mix(in srgb, var(--foreground) 12%, transparent);
          border-radius: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .preview-heading {
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--foreground);
        }
        .preview-field {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .preview-label {
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: color-mix(in srgb, var(--foreground) 60%, transparent);
        }
        .preview-hint {
          font-size: 0.75rem;
          font-weight: 400;
          text-transform: none;
          letter-spacing: 0;
          color: color-mix(in srgb, var(--foreground) 45%, transparent);
        }
        .preview-input {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.9rem;
          color: var(--foreground);
          background: var(--background);
          border: 1px solid color-mix(in srgb, var(--foreground) 18%, transparent);
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .preview-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px color-mix(in srgb, #2563eb 22%, transparent);
        }
        .preview-input--valid { border-color: #16a34a; }
        .preview-input--invalid {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px color-mix(in srgb, #dc2626 18%, transparent);
        }
        .preview-radio-group {
          display: flex;
          gap: 1rem;
        }
        .preview-radio {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.9rem;
          cursor: pointer;
          color: var(--foreground);
        }
        .preview-result {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .preview-link {
          display: inline-block;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.85rem;
          word-break: break-all;
          color: #2563eb;
          padding: 0.6rem 0.75rem;
          background: color-mix(in srgb, #2563eb 8%, var(--background));
          border: 1px solid color-mix(in srgb, #2563eb 30%, transparent);
          border-radius: 0.5rem;
          cursor: pointer;
        }
        .preview-link:hover { background: color-mix(in srgb, #2563eb 16%, var(--background)); }
        .preview-link--disabled {
          color: color-mix(in srgb, var(--foreground) 40%, transparent);
          background: color-mix(in srgb, var(--foreground) 5%, var(--background));
          border-color: color-mix(in srgb, var(--foreground) 15%, transparent);
          pointer-events: none;
        }
      `}</style>
      <span className="preview-heading">Create a preview link</span>

      <div className="preview-field">
        <label className="preview-label" htmlFor="preview-key">Key <span className="preview-hint">— v4 UUID</span></label>
        <input id="preview-key" className={fieldClass(key, keyValid)} value={key} onChange={(e) => setKey(e.target.value)} placeholder="00000000-0000-4000-8000-000000000000" />
      </div>

      <div className="preview-field">
        <label className="preview-label" htmlFor="preview-version">Version <span className="preview-hint">— integer</span></label>
        <input id="preview-version" className={fieldClass(version, versionValid)} value={version} onChange={(e) => setVersion(e.target.value)} inputMode="numeric" placeholder="1" />
      </div>

      <div className="preview-field">
        <label className="preview-label" htmlFor="preview-locale">Locale <span className="preview-hint">— e.g. en or en-US</span></label>
        <input id="preview-locale" className={fieldClass(locale, localeValid)} value={locale} onChange={(e) => setLocale(e.target.value)} placeholder="en-US" />
      </div>

      <div className="preview-field">
        <span className="preview-label">Mode</span>
        <div className="preview-radio-group">
          <label className="preview-radio">
            <input type="radio" name="preview-mode" value="single" checked={mode === 'single'} onChange={() => setMode('single')} />
            Single query
          </label>
          <label className="preview-radio">
            <input type="radio" name="preview-mode" value="multi" checked={mode === 'multi'} onChange={() => setMode('multi')} />
            Multi query
          </label>
        </div>
      </div>

      <div className="preview-field">
        <span className="preview-label">Context</span>
        <div className="preview-radio-group">
          <label className="preview-radio">
            <input type="radio" name="preview-ctx" value="edit" checked={ctx === 'edit'} onChange={() => setCtx('edit')} />
            Edit
          </label>
          <label className="preview-radio">
            <input type="radio" name="preview-ctx" value="preview" checked={ctx === 'preview'} onChange={() => setCtx('preview')} />
            Preview
          </label>
        </div>
      </div>

      <div className="preview-result">
        <span className="preview-label">Preview link</span>
        <a
          className={allValid ? 'preview-link' : 'preview-link preview-link--disabled'}
          href={allValid ? href : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!allValid}
        >
          {href}
        </a>
      </div>
    </section>
  );
}
