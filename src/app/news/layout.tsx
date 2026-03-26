import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mutual Fund Market News',
  description:
    'AI-curated mutual fund and market news relevant for HDFC MFDs. Stay informed on SEBI updates, market moves, and fund industry developments.',
  alternates: { canonical: '/news' },
  openGraph: {
    title: 'Mutual Fund Market News | HDFC MFD Hub',
    description:
      'AI-curated mutual fund and market news for HDFC MFDs. SEBI updates, market moves, and fund industry developments.',
    url: '/news',
  },
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
