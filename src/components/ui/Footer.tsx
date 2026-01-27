import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-white font-bold text-lg">
                Mutual Fund Dost
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your trusted guide for XYZ Mutual Fund investments. We help
              Indian investors make informed decisions for long-term wealth
              creation.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/news"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  News Insights
                </Link>
              </li>
              <li>
                <Link
                  href="/discover"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Discover Funds
                </Link>
              </li>
              <li>
                <a
                  href="https://www.hdfcfund.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  XYZ Mutual Fund Official
                </a>
              </li>
              <li>
                <a
                  href="https://www.sebi.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  SEBI
                </a>
              </li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div>
            <h3 className="text-white font-semibold mb-4">Important</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Mutual Fund investments are subject to market risks, read all
              scheme related documents carefully. Past performance is not
              indicative of future returns. This platform is for educational and
              informational purposes only and does not constitute investment
              advice. Please consult a SEBI-registered investment advisor before
              making investment decisions.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Mutual Fund Dost. Not affiliated
            with XYZ Asset Management Company Ltd. All fund data is sourced
            from publicly available information.
          </p>
        </div>
      </div>
    </footer>
  );
}
