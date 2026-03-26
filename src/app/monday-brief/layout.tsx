import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Monday Morning Brief',
  description:
    'Start your week ready. Get a concise AI-generated market brief with key mutual fund insights, macro cues, and client conversation starters for HDFC MFDs.',
  alternates: { canonical: '/monday-brief' },
  openGraph: {
    title: 'Monday Morning Brief | HDFC MFD Hub',
    description:
      'Start your week ready. AI-generated market brief with key mutual fund insights and client conversation starters for HDFC MFDs.',
    url: '/monday-brief',
  },
};

export default function MondayBriefLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
