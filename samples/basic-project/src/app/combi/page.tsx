'use client';
import { useState, useEffect, useRef } from "react";

export default function CombiViewPage() {
  const [ host, setHost ] = useState<string>();
  const [ path, setPath ] = useState<string>('');
  const pathField = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const url = new URL(window.location.href);
    setHost(`${url.protocol}//${url.host}/`);
    document.title = `Combi view - /`;
  }, []);

  function handleGo() {
    if (pathField.current) {
      const newPath = pathField.current.value;
      const normalizedPath = newPath.startsWith('/') ? newPath.substring(1) : newPath;
      const hashed = normalizedPath?.includes('?') ? normalizedPath : normalizedPath + '?ver=' + Math.floor(Math.random() * 1000000);
      setPath(hashed);
      document.title = `Combi view - /${normalizedPath}`;
    }
  }

  return (
    <div style={{ display:'flex', flexDirection: 'column', height: '100vh', justifyContent: 'stretch', padding: '1rem', gap: '1rem' }}>
      <div style={{ flex: '0', width: '100%'}}><span>{ host }</span><input type="url" ref={pathField} /><button onClick={handleGo}>Go</button></div>
      <div style={{ flex: '1', width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'stretch', gap: '2rem' }}>
        <div style={{ flex: '1', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'start', gap: '0.5rem' }}>
          <h1 style={{ width: '100%', textAlign: 'center' }}>Single combined query</h1>
          {host && <iframe src={new URL(path, host+'single/').toString()} style={{ flex: '1', width: '100%', height: '100%' }} />}
        </div>
        <div style={{ flex: '1', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'start', gap: '0.5rem' }}>
          <h1 style={{ width: '100%', textAlign: 'center' }}>Two queries</h1>
          {host && <iframe src={new URL(path, host+'multi/').toString()} style={{ flex: '1', width: '100%', height: '100%' }} />}
        </div>
      </div>
    </div>
  )
}
