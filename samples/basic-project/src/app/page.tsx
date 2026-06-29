import Link from "next/link";

export const metadata = {
  title: 'Optimizely DXP Next.JS Sample Project',
  description: 'A sample project demonstrating the use of Optimizely DXP with Next.JS',
}

export default function HomePage() {
  return (<main style={{ padding: '2rem', maxWidth: '48rem', margin: '0 auto' }}>
    <p style={{ paddingBottom: '2rem' }}>Welcome to the Optimizely DXP Next.JS Sample Project, pick the routing variant to validate things are working.</p>
    <div style={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-around', gap: '2rem' }}>
      <div><Link style={{ border: '1px solid #999', padding: '0.5rem 1rem', borderRadius: '0.75rem' }} href="/multi">👉 Multi query variant</Link></div>
      <div><Link style={{ border: '1px solid #999', padding: '0.5rem 1rem', borderRadius: '0.75rem' }} href="/single">👉 Single query variant</Link></div>
    </div>
  </main>)
}
