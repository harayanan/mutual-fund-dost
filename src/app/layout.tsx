import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import DisclaimerBanner from '@/components/ui/DisclaimerBanner';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const BASE_URL = 'https://mutual-fund-dost.vercel.app';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'HDFC MFD Hub — Tools for HDFC Mutual Fund Distributors',
    template: '%s | HDFC MFD Hub',
  },
  description:
    'AI-powered platform for HDFC Mutual Fund distributors. Monday Morning Brief, fund performance dashboard, AI fund finder, and market news insights. Win more client conversations every week.',
  keywords: [
    'HDFC mutual fund',
    'MFD tools',
    'mutual fund distributor',
    'HDFC AMC',
    'fund performance',
    'Monday Morning Brief',
    'fund recommendation',
    'India',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'HDFC MFD Hub',
    title: 'HDFC MFD Hub — Tools for HDFC Mutual Fund Distributors',
    description:
      'AI-powered platform for HDFC Mutual Fund distributors. Monday Morning Brief, fund performance dashboard, AI fund finder, and market news insights.',
    url: BASE_URL,
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'HDFC MFD Hub',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HDFC MFD Hub — Tools for HDFC Mutual Fund Distributors',
    description:
      'AI-powered platform for HDFC Mutual Fund distributors. Monday Morning Brief, fund performance dashboard, AI fund finder, and market news insights.',
    images: ['/og-default.png'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      url: BASE_URL,
      name: 'HDFC MFD Hub',
      description: 'AI-powered tools for HDFC Mutual Fund distributors',
      inLanguage: 'en-IN',
    },
    {
      '@type': 'WebApplication',
      '@id': `${BASE_URL}/#webapp`,
      name: 'HDFC MFD Hub',
      url: BASE_URL,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      description:
        'AI-powered platform for HDFC Mutual Fund distributors providing Monday Morning Brief, fund performance dashboard, AI fund finder, and market news insights.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
      featureList: [
        'Monday Morning Brief for MFDs',
        'Fund Performance Dashboard with heatmap',
        'AI-powered fund recommendations',
        'Market news analysis',
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DisclaimerBanner />
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
