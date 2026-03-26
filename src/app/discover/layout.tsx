import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discover Funds — AI Fund Recommendations',
  description:
    'Get SEBI-compliant HDFC mutual fund recommendations based on your client\'s risk profile. AI-powered fund matching across 6 risk levels.',
  alternates: { canonical: '/discover' },
  openGraph: {
    title: 'Discover Funds — AI Fund Recommendations | HDFC MFD Hub',
    description:
      'SEBI-compliant HDFC mutual fund recommendations based on risk profile. AI-powered fund matching across 6 risk levels.',
    url: '/discover',
  },
};

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
