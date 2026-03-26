import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SIP Planner & Goal Calculator',
  description:
    'Plan client SIP investments and calculate capital gains tax on HDFC mutual fund redemptions. SEBI-compliant tools for MFD client conversations.',
  alternates: { canonical: '/planner' },
  openGraph: {
    title: 'SIP Planner & Goal Calculator | HDFC MFD Hub',
    description:
      'Plan client SIP investments and calculate capital gains tax on HDFC mutual fund redemptions.',
    url: '/planner',
  },
};

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
