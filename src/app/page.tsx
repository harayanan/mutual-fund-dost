import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'HDFC MFD Hub — AI Tools for HDFC Mutual Fund Distributors',
  description:
    'Win every client conversation with AI-powered tools built for HDFC MFDs. Monday Morning Brief, fund performance heatmap, SIP planner, capital gains calculator, portfolio statement generator.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'HDFC MFD Hub — AI Tools for HDFC Mutual Fund Distributors',
    description:
      'Win every client conversation with AI-powered tools built for HDFC MFDs. Monday Morning Brief, fund performance heatmap, SIP planner, capital gains calculator, portfolio statement generator.',
    url: '/',
  },
};
import {
  Newspaper,
  Calendar,
  BarChart3,
  Target,
  FileText,
  TrendingUp,
  Users,
  MessageSquare,
  IndianRupee,
} from 'lucide-react';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-700 via-red-800 to-red-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-red-100">
                AI-powered tools for HDFC Mutual Fund Distributors
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Win Every Client
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400">
                Conversation This Week
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-red-100 leading-relaxed mb-8 max-w-2xl mx-auto">
              Every Monday morning, get your complete playbook: market context, fund performance,
              client scripts, and talking points. Built exclusively for HDFC MF distributors.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/monday-brief"
                className="inline-flex items-center justify-center gap-2 bg-white text-red-700 font-bold px-8 py-4 rounded-xl hover:bg-red-50 transition-colors text-lg"
              >
                <Calendar className="w-5 h-5" />
                This Week&apos;s Brief
              </Link>
              <Link
                href="/funds"
                className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-medium px-8 py-4 rounded-xl hover:bg-white/20 transition-colors text-lg"
              >
                <BarChart3 className="w-5 h-5" />
                Fund Dashboard
              </Link>
              <Link
                href="/planner"
                className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-medium px-8 py-4 rounded-xl hover:bg-white/20 transition-colors text-lg"
              >
                <Target className="w-5 h-5" />
                Client Planner
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Your Complete MFD Toolkit
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Everything you need to be the best-prepared distributor in the room
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {/* Monday Brief */}
            <Link href="/monday-brief" className="group">
              <div className="bg-gradient-to-br from-slate-50 to-red-50 border border-gray-200 rounded-2xl p-6 h-full hover:shadow-xl transition-all group-hover:border-red-300">
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Monday Morning Brief
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Weekly playbook: market summary, five key stories with client scripts,
                  fund spotlight, objection of the week, and week-ahead radar.
                  Print it. Walk into every meeting prepared.
                </p>
                <ul className="space-y-1.5">
                  {[
                    'English + Hindi versions',
                    'Print-ready PDF format',
                    'Ready-made client scripts',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Link>

            {/* Fund Dashboard */}
            <Link href="/funds" className="group">
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-gray-200 rounded-2xl p-6 h-full hover:shadow-xl transition-all group-hover:border-blue-300">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Fund Performance Dashboard
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  All 60 HDFC fund schemes with live NAV, 1Y/3Y/5Y returns, AUM,
                  and expense ratio. Sort, filter, and compare up to 4 funds side-by-side.
                </p>
                <ul className="space-y-1.5">
                  {[
                    '60 HDFC fund schemes',
                    'Side-by-side comparison',
                    'Updated daily via AMFI',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Link>

            {/* Client Planner */}
            <Link href="/planner" className="group">
              <div className="bg-gradient-to-br from-slate-50 to-emerald-50 border border-gray-200 rounded-2xl p-6 h-full hover:shadow-xl transition-all group-hover:border-emerald-300">
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Client SIP Planner
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Goal-based SIP calculator with WhatsApp-shareable output.
                  Show clients exactly what SIP they need to reach their goal,
                  with HDFC fund recommendations.
                </p>
                <ul className="space-y-1.5">
                  {[
                    'Goal → SIP calculator',
                    'WhatsApp-ready output',
                    'HDFC fund suggestions',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Link>

            {/* Portfolio Statement */}
            <Link href="/portfolio-statement" className="group">
              <div className="bg-gradient-to-br from-slate-50 to-amber-50 border border-gray-200 rounded-2xl p-6 h-full hover:shadow-xl transition-all group-hover:border-amber-300">
                <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center mb-4">
                  <IndianRupee className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Portfolio Statement
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Enter client holdings, get live AMFI NAVs, and generate a
                  clean print-ready portfolio statement in seconds. No signup required.
                </p>
                <ul className="space-y-1.5">
                  {[
                    'Live NAV from AMFI India',
                    'Gain/loss + annualised return',
                    'Print-ready PDF output',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Link>

            {/* News Insights */}
            <Link href="/news" className="group">
              <div className="bg-gradient-to-br from-slate-50 to-indigo-50 border border-gray-200 rounded-2xl p-6 h-full hover:shadow-xl transition-all group-hover:border-indigo-300">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4">
                  <Newspaper className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  News Insights
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  AI-filtered financial news that matters for HDFC fund conversations.
                  Stop reading 30 articles — get the 5 that matter for your clients today.
                </p>
                <ul className="space-y-1.5">
                  {[
                    'ET, Mint, Moneycontrol',
                    'AI-tagged by fund impact',
                    'Daily refresh at 1 AM IST',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Why This Matters Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Why HDFC Distributors Need This
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Distributors sell 5–8 AMCs. They push whichever one makes their job easiest.
              The AMC that puts the right words in their mouth on Monday morning wins the week.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: MessageSquare,
                title: 'Ready Client Scripts',
                description:
                  'Every story comes with a ready script. When your client says "markets are down", you have the data-backed response on your desk Monday morning.',
              },
              {
                icon: TrendingUp,
                title: 'One Step Ahead',
                description:
                  'Know what\'s coming before your clients ask. NFO windows, RBI policy dates, market events — all in the Week Ahead section every Monday.',
              },
              {
                icon: FileText,
                title: 'WhatsApp-Ready',
                description:
                  'Every output is designed for WhatsApp. Share fund spotlights, SIP calculations, and market summaries with clients in one tap.',
              },
              {
                icon: BarChart3,
                title: 'Fund Performance at a Glance',
                description:
                  'Stop digging through factsheets. All 60 HDFC funds ranked, filtered, and compared in one dashboard. Know which funds to spotlight this week.',
              },
              {
                icon: Users,
                title: 'Client Persona Scripts',
                description:
                  'Tailored talking points for 5 client types — the anxious investor, the first-time SIP buyer, the market timer, the retiree, and the HNI. Know what to say to each.',
              },
              {
                icon: Target,
                title: 'Goal-Based Conversations',
                description:
                  'Close more SIPs with the goal planner. Input their target, show the monthly SIP needed, and recommend the right HDFC fund — all in under 2 minutes.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <item.icon className="w-8 h-8 text-red-600 mb-4" />
                <h3 className="text-base font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Start Your Week Prepared
          </h2>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto">
            Get this week&apos;s Monday Morning Brief — your complete client conversation
            playbook, ready in one click. No login required.
          </p>
          <Link
            href="/monday-brief"
            className="inline-flex items-center justify-center gap-2 bg-red-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-red-700 transition-colors text-lg"
          >
            <Calendar className="w-5 h-5" />
            Get This Week&apos;s Brief
          </Link>
          <p className="text-xs text-gray-400 mt-4">
            No sign-up required. Completely free for HDFC MF distributors.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-red-400">60</div>
              <div className="text-sm text-gray-400 mt-1">HDFC Funds Tracked</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-400">5</div>
              <div className="text-sm text-gray-400 mt-1">Sections Per Brief</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-400">2</div>
              <div className="text-sm text-gray-400 mt-1">Languages (EN + HI)</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-400">Every Monday</div>
              <div className="text-sm text-gray-400 mt-1">Fresh Brief</div>
            </div>
          </div>
          <div className="text-center mt-6 pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-500">
              Fund data refreshed daily at 7:30 PM IST via AMFI. News insights updated daily at 1:00 AM IST.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
