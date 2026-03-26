import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daily Distributor Brief',
  description:
    'Daily AI-generated brief for HDFC mutual fund distributors. Market summary, fund highlights, and key talking points for client conversations.',
  alternates: { canonical: '/daily-brief' },
  openGraph: {
    title: 'Daily Distributor Brief | HDFC MFD Hub',
    description:
      'Daily AI-generated brief for HDFC MFDs. Market summary, fund highlights, and key talking points.',
    url: '/daily-brief',
  },
};

export default function DailyBriefLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
