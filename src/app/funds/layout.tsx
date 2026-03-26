import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fund Performance Dashboard',
  description:
    'Screen and compare HDFC mutual fund performance across equity, debt, and hybrid categories. NAV trends and fund details for 60+ HDFC schemes.',
  alternates: { canonical: '/funds' },
  openGraph: {
    title: 'Fund Performance Dashboard | HDFC MFD Hub',
    description:
      'Screen and compare HDFC mutual fund performance. NAV trends and fund details for 60+ HDFC schemes.',
    url: '/funds',
  },
};

export default function FundsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
