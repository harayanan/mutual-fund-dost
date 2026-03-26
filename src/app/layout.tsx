import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import DisclaimerBanner from '@/components/ui/DisclaimerBanner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'HDFC MFD Hub — Tools for HDFC Mutual Fund Distributors',
  description:
    'AI-powered platform for HDFC Mutual Fund distributors. Monday Morning Brief, fund performance dashboard, SIP planner, and client conversation tools. Win more client conversations every week.',
  keywords: [
    'HDFC mutual fund',
    'MFD tools',
    'mutual fund distributor',
    'HDFC AMC',
    'fund performance',
    'Monday Morning Brief',
    'SIP calculator',
    'India',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DisclaimerBanner />
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
