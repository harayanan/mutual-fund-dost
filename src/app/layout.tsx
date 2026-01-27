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
  title: 'Mutual Fund Dost - Your XYZ Mutual Fund Guide',
  description:
    'Your trusted guide for XYZ Mutual Fund investments. Get AI-powered news insights, personalized fund recommendations based on your risk profile, and expert advice for long-term wealth creation.',
  keywords: [
    'mutual fund',
    'XYZ',
    'investment',
    'India',
    'SIP',
    'risk profiler',
    'wealth creation',
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
