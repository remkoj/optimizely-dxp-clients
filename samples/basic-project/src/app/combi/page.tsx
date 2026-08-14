'use client';
import { useState, useEffect, useRef } from 'react';

export default function CombiViewPage() {
  const [ host, setHost ] = useState<string>();
  const [ path, setPath ] = useState<string>('');
  const pathField = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {

    const url = new URL(window.location.href);
    setHost(`${url.protocol}//${url.host}/`);

    const queryPath = url.searchParams.get('path');
    let storedPath: string | null = null;
    try {
      storedPath = window.localStorage.getItem('combi-path');
    } catch {
      storedPath = null;
    }
    const initialPath = queryPath ?? storedPath;
    if (initialPath) {
      if (pathField.current) pathField.current.value = initialPath;
      navigate(initialPath);
    } else {
      document.title = 'Combi view - /';
    }
  }, []);

  // Scroll the combi-view to the top of the viewport so the full 100vh panel
  // is on screen, regardless of any header/footer rendered around it.
  useEffect(() => {
    rootRef.current?.scrollIntoView({ block: 'start' });
  },[rootRef.current]);

  function navigate(rawPath: string) {
    const normalizedPath = rawPath.startsWith('/') ? rawPath.substring(1) : rawPath;
    const hashed = normalizedPath?.includes('?') ? normalizedPath : normalizedPath + '?ver=' + Math.floor(Math.random() * 1000000);
    setPath(hashed);
    document.title = `Combi view - /${normalizedPath}`;

    // Persist the path so it can be restored on reload.
    try {
      window.localStorage.setItem('combi-path', normalizedPath);
    } catch {
      // Ignore storage errors (e.g. private mode / disabled storage).
    }
    const url = new URL(window.location.href);
    url.searchParams.set('path', normalizedPath);
    window.history.replaceState(null, '', url.toString());
  }

  function handleGo() {
    if (pathField.current) navigate(pathField.current.value);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleGo();
  }

  const singleSrc = host ? new URL(path, host + 'single/').toString() : undefined;
  const multiSrc = host ? new URL(path, host + 'multi/').toString() : undefined;

  return (
    <div ref={rootRef} style={{ display:'flex', flexDirection: 'column', height: '100vh', justifyContent: 'stretch', padding: '1rem', gap: '1rem' }}>
      <style>{`
        .combi-bar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 0.875rem;
          background: color-mix(in srgb, var(--foreground) 4%, var(--background));
          border: 1px solid color-mix(in srgb, var(--foreground) 12%, transparent);
          border-radius: 0.625rem;
          box-shadow: 0 1px 2px color-mix(in srgb, var(--foreground) 8%, transparent);
        }
        .combi-host {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.85rem;
          color: color-mix(in srgb, var(--foreground) 60%, transparent);
          white-space: nowrap;
        }
        .combi-input {
          flex: 1;
          min-width: 0;
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
        .combi-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px color-mix(in srgb, #2563eb 22%, transparent);
        }
        .combi-go {
          font-size: 0.9rem;
          font-weight: 600;
          color: #fff;
          background: #2563eb;
          border: none;
          border-radius: 0.5rem;
          padding: 0.5rem 1.25rem;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.05s ease;
        }
        .combi-go:hover { background: #1d4ed8; }
        .combi-go:active { transform: translateY(1px); }
        .combi-column {
          flex: 1;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: start;
          gap: 0.5rem;
        }
        .combi-header {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding-bottom: 0.25rem;
        }
        .combi-title {
          text-align: center;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: color-mix(in srgb, var(--foreground) 70%, transparent);
        }
        .combi-breakout {
          position: absolute;
          right: 0;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: #2563eb;
          background: color-mix(in srgb, #2563eb 8%, var(--background));
          border: 1px solid color-mix(in srgb, #2563eb 35%, transparent);
          border-radius: 0.5rem;
          padding: 0.3rem 0.65rem;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .combi-breakout:hover {
          background: color-mix(in srgb, #2563eb 16%, var(--background));
          border-color: #2563eb;
        }
        .combi-frame {
          flex: 1;
          width: 100%;
          height: 100%;
          border: 1px solid color-mix(in srgb, var(--foreground) 12%, transparent);
          border-radius: 0.625rem;
          background: var(--background);
          box-shadow: 0 1px 3px color-mix(in srgb, var(--foreground) 10%, transparent);
        }
      `}</style>
      <div style={{ flex: '0', width: '100%'}} className="combi-bar">
        <span className="combi-host">{ host }</span>
        <input type="url" ref={pathField} onKeyDown={handleKeyDown} placeholder="path/to/page" className="combi-input" />
        <button onClick={handleGo} className="combi-go">Go</button>
      </div>
      <div style={{ flex: '1', width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'stretch', gap: '2rem' }}>
        <div className="combi-column">
          <div className="combi-header">
            <h1 className="combi-title">Single combined query</h1>
            {host && <a className="combi-breakout" href={singleSrc} target="_blank" rel="noopener noreferrer" title="Open in a new tab">Open in new window ↗</a>}
          </div>
          {host && <iframe src={singleSrc} className="combi-frame" />}
        </div>
        <div className="combi-column">
          <div className="combi-header">
            <h1 className="combi-title">Two queries</h1>
            {host && <a className="combi-breakout" href={multiSrc} target="_blank" rel="noopener noreferrer" title="Open in a new tab">Open in new window ↗</a>}
          </div>
          {host && <iframe src={multiSrc} className="combi-frame" />}
        </div>
      </div>
    </div>
  )
}
