'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                HDFC MFD Hub
              </h1>
              <p className="text-[10px] text-gray-500 -mt-0.5">
                For HDFC Mutual Fund Distributors
                <span className="ml-1 text-gray-400" title={`Built ${process.env.NEXT_PUBLIC_BUILD_TIME ?? ''}`}>
                  v{process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0'}
                </span>
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/monday-brief"
              className="text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
            >
              Monday Brief
            </Link>
            <Link
              href="/funds"
              className="text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
            >
              Fund Dashboard
            </Link>
            <Link
              href="/discover"
              className="text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
            >
              Fund Finder
            </Link>
            <Link
              href="/news"
              className="text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
            >
              News Insights
            </Link>
            <Link
              href="/monday-brief"
              className="bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              This Week&apos;s Brief
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 mt-2 pt-4">
            <nav className="flex flex-col gap-3">
              <Link
                href="/monday-brief"
                className="text-sm font-medium text-gray-700 hover:text-red-600 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Monday Brief
              </Link>
              <Link
                href="/funds"
                className="text-sm font-medium text-gray-700 hover:text-red-600 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Fund Dashboard
              </Link>
              <Link
                href="/discover"
                className="text-sm font-medium text-gray-700 hover:text-red-600 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Fund Finder
              </Link>
              <Link
                href="/news"
                className="text-sm font-medium text-gray-700 hover:text-red-600 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                News Insights
              </Link>
              <Link
                href="/monday-brief"
                className="bg-red-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-red-700 text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                This Week&apos;s Brief
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
