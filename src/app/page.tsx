import Link from 'next/link';
import {
  Newspaper,
  Search,
  TrendingUp,
  Shield,
  Target,
  BookOpen,
  BarChart3,
} from 'lucide-react';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-blue-100">
                Powered by AI, focused on HDFC Mutual Funds
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Your Trusted
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400">
                Mutual Fund Dost
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-blue-100 leading-relaxed mb-8 max-w-2xl mx-auto">
              Navigate HDFC Mutual Funds with confidence. Get AI-powered news
              insights, personalized risk profiling, and expert fund
              recommendations built on principles of long-term wealth creation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/discover"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors text-lg"
              >
                <Target className="w-5 h-5" />
                Find Your Funds
              </Link>
              <Link
                href="/funds"
                className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-medium px-8 py-4 rounded-xl hover:bg-white/20 transition-colors text-lg"
              >
                <BarChart3 className="w-5 h-5" />
                Fund Screener
              </Link>
              <Link
                href="/news"
                className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-medium px-8 py-4 rounded-xl hover:bg-white/20 transition-colors text-lg"
              >
                <Newspaper className="w-5 h-5" />
                News Insights
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Three Powerful Tools, One Goal
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Long-term wealth creation for every Indian investor
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* News Insights Card */}
            <Link href="/news" className="group">
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-gray-200 rounded-2xl p-8 h-full hover:shadow-xl transition-all group-hover:border-blue-300">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <Newspaper className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  News Insights
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Stay ahead of the market. Our AI reads the latest financial
                  news — macroeconomic shifts, geopolitical events, sector
                  movements — and tells you exactly what it means for your HDFC
                  mutual fund investments.
                </p>
                <ul className="space-y-2">
                  {[
                    'Real-time news from top Indian financial sources',
                    'AI-powered impact analysis on HDFC funds',
                    'Actionable insights, not noise',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Link>

            {/* Discover Card */}
            <Link href="/discover" className="group">
              <div className="bg-gradient-to-br from-slate-50 to-indigo-50 border border-gray-200 rounded-2xl p-8 h-full hover:shadow-xl transition-all group-hover:border-indigo-300">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                  <Search className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Discover Funds
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Find the perfect fund basket for you. Take a quick risk
                  assessment aligned with SEBI guidelines, and get personalized
                  HDFC fund recommendations built on proven investment
                  principles.
                </p>
                <ul className="space-y-2">
                  {[
                    'Quick SEBI-aligned risk profiling',
                    'Personalized fund basket with allocation %',
                    'Guided by Buffett-inspired long-term principles',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Link>

            {/* Fund Screener Card */}
            <Link href="/funds" className="group">
              <div className="bg-gradient-to-br from-slate-50 to-emerald-50 border border-gray-200 rounded-2xl p-8 h-full hover:shadow-xl transition-all group-hover:border-emerald-300">
                <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Fund Screener
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Deep-dive into all 60 HDFC fund schemes. Sort by returns,
                  AUM, expense ratio, and risk level. Compare up to 4 funds
                  side-by-side with automatic best-in-class highlighting.
                </p>
                <ul className="space-y-2">
                  {[
                    'Sortable performance tables for all funds',
                    'Side-by-side comparison with trophy highlights',
                    'Filter by category, risk level, and more',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Principles Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Our Investment Philosophy
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Built on timeless principles from the world&apos;s greatest
              investors
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp,
                title: 'Long-term Thinking',
                description:
                  '"The stock market is a device for transferring money from the impatient to the patient." We optimize for decades, not days.',
              },
              {
                icon: Shield,
                title: 'Risk-adjusted Returns',
                description:
                  'Aligned with SEBI\'s 6-level risk framework. We match your temperament and goals with the right fund basket.',
              },
              {
                icon: Target,
                title: 'Diversification',
                description:
                  'Core + Satellite approach. 70% in diversified funds for stability, 30% in focused strategies for alpha generation.',
              },
              {
                icon: BookOpen,
                title: 'SEBI Compliant',
                description:
                  'Every recommendation follows SEBI guidelines for mutual fund categorization, risk disclosure, and investor protection.',
              },
              {
                icon: TrendingUp,
                title: 'Cost Efficiency',
                description:
                  'As Buffett says, costs matter. We factor in expense ratios and prefer funds that deliver value after fees.',
              },
              {
                icon: Shield,
                title: 'Track Record Matters',
                description:
                  'We prioritize funds with 5+ years of consistent performance across market cycles — not just recent winners.',
              },
            ].map((principle) => (
              <div
                key={principle.title}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <principle.icon className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  {principle.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {principle.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Start Your Wealth Creation Journey
          </h2>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto">
            Take the 2-minute risk assessment and discover the HDFC fund basket
            that&apos;s right for you.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors text-lg"
          >
            <Target className="w-5 h-5" />
            Get Your Fund Basket
          </Link>
          <p className="text-xs text-gray-400 mt-4">
            No sign-up required. Completely free.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-400">60</div>
              <div className="text-sm text-gray-400 mt-1">
                HDFC Funds Covered
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-400">6</div>
              <div className="text-sm text-gray-400 mt-1">
                SEBI Risk Levels
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-400">6</div>
              <div className="text-sm text-gray-400 mt-1">Categories</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-400">30+</div>
              <div className="text-sm text-gray-400 mt-1">Years of Data</div>
            </div>
          </div>
          <div className="text-center mt-6 pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-500">
              Fund data refreshed daily at 1:00 AM IST via AMFI &amp; mfapi.in. News insights updated daily.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
