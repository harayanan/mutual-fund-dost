export default function DisclaimerBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <p className="text-xs text-amber-800 text-center">
          <span className="font-semibold">Disclaimer:</span> Mutual fund
          investments are subject to market risks. Read all scheme-related
          documents carefully. This is an educational platform, not investment
          advice.
        </p>
      </div>
    </div>
  );
}
