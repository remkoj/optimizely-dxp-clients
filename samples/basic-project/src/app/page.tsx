import Link from "next/link";

export const metadata = {
  title: 'Optimizely DXP Next.JS Sample Project',
  description: 'A sample project demonstrating the use of Optimizely DXP with Next.JS',
}

export default function HomePage() {
  return (<main style={{ padding: '2rem', maxWidth: '48rem', margin: '0 auto' }}>
    <p style={{ paddingBottom: '2rem' }}>Welcome to the Optimizely DXP Next.JS Sample Project, pick the routing variant to validate things are working.</p>
    <div style={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-around', gap: '2rem' }}>
      <div style={{ flex: '1', width: '100%' }}>
        <Link style={{ display: 'block', border: '1px solid #999', padding: '0.5rem 1rem', borderRadius: '0.75rem' }} href="/multi">👉 Multi query</Link>
        <p style={{ fontSize: '0.875rem', color: '#666', paddingTop: '0.5rem' }}>Browse the site, without using `getContentByPath`, `getContentById`. This relies on multiple queries to fetch content.</p>
      </div>
      <div style={{ flex: '1', width: '100%' }}>
        <Link style={{ display: 'block', border: '1px solid #999', padding: '0.5rem 1rem', borderRadius: '0.75rem' }} href="/single">👉 Single query</Link>
        <p style={{ fontSize: '0.875rem', color: '#666', paddingTop: '0.5rem' }}>Browse the site using a single query to fetch content.</p>
      </div>
      <div style={{ flex: '1', width: '100%' }}>
        <Link style={{ display: 'block', border: '1px solid #999', padding: '0.5rem 1rem', borderRadius: '0.75rem' }} href="/combi">👉 Side-by-side</Link>
        <p style={{ fontSize: '0.875rem', color: '#666', paddingTop: '0.5rem' }}>Compare the results of single and multi queries side by side.</p>
      </div>
    </div>
  </main>)
}
