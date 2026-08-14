import Link from 'next/link';
import ScrollToTop from './scroll-to-top';
import PreviewLink from './preview-link';

export const metadata = {
  title: 'Optimizely DXP Next.JS Sample Project',
  description: 'A sample project demonstrating the use of Optimizely DXP with Next.JS',
}

const variants = [
  {
    href: '/single',
    title: 'Single query',
    description: 'Browse the site using a single query to fetch content.',
  },
  {
    href: '/multi',
    title: 'Multi query',
    description: 'Browse the site, without using `getContentByPath`, `getContentById`. This relies on multiple queries to fetch content.',
  },
  {
    href: '/combi',
    title: 'Side-by-side',
    description: 'Compare the results of single and multi queries side by side.',
  },
];

export default function HomePage() {
  return (<>
    <main style={{ padding: '2rem', maxWidth: '48rem', margin: '0 auto', minHeight: '100vh' }}>
      <ScrollToTop />
      <style>{`
      .home-title {
        font-size: 1.75rem;
        font-weight: 700;
        letter-spacing: -0.01em;
        color: var(--foreground);
        margin-bottom: 0.5rem;
      }
      .home-intro {
        padding-bottom: 2rem;
        font-size: 1rem;
        line-height: 1.6;
        max-width: 42rem;
        color: color-mix(in srgb, var(--foreground) 75%, transparent);
      }
      .home-grid {
        width: 100%;
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        gap: 1.5rem;
      }
      .home-card {
        flex: 1;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1.25rem;
        background: color-mix(in srgb, var(--foreground) 4%, var(--background));
        border: 1px solid color-mix(in srgb, var(--foreground) 12%, transparent);
        border-radius: 0.75rem;
        box-shadow: 0 1px 2px color-mix(in srgb, var(--foreground) 8%, transparent);
        transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.05s ease;
      }
      .home-card:hover {
        border-color: color-mix(in srgb, #2563eb 60%, transparent);
        box-shadow: 0 4px 12px color-mix(in srgb, var(--foreground) 12%, transparent);
        transform: translateY(-2px);
      }
      .home-card-title {
        font-size: 1rem;
        font-weight: 600;
        color: #2563eb;
      }
      .home-card-desc {
        font-size: 0.875rem;
        line-height: 1.5;
        color: color-mix(in srgb, var(--foreground) 55%, transparent);
      }
    `}</style>
      <h1 className="home-title">Optimizely DXP Next.js Sample Project</h1>
      <p className="home-intro">This sample demonstrates rendering Optimizely DXP content with Next.js. Pick a routing variant below to validate your setup &mdash; each one fetches and renders the same content using a different query strategy, so you can compare behaviour and confirm everything is wired up correctly.</p>
      <div className="home-grid">
        {variants.map((variant) => (
          <Link key={variant.href} className="home-card" href={variant.href}>
            <span className="home-card-title">👉 {variant.title}</span>
            <span className="home-card-desc">{variant.description}</span>
          </Link>
        ))}
      </div>
      <PreviewLink />
    </main></>);
}
