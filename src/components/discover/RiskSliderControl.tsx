'use client';

import { SEBI_RISK_LEVELS, RISK_LEVEL_COLORS, RISK_LEVEL_DESCRIPTIONS, type SEBIRiskLevel } from '@/lib/advisor-engine';

interface RiskSliderControlProps {
  value: SEBIRiskLevel;
  onChange: (level: SEBIRiskLevel) => void;
}

export default function RiskSliderControl({ value, onChange }: RiskSliderControlProps) {
  const currentIndex = SEBI_RISK_LEVELS.indexOf(value);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          SEBI Risk Profile
        </h3>
        <p className="text-sm text-gray-500">
          Adjust to see fund recommendations for your risk appetite
        </p>
      </div>

      {/* Riskometer Visual */}
      <div className="flex justify-center mb-6">
        <div className="relative w-64 h-32">
          {/* Semicircle segments */}
          <svg viewBox="0 0 200 100" className="w-full h-full">
            {SEBI_RISK_LEVELS.map((level, i) => {
              const startAngle = 180 + i * 30;
              const endAngle = 180 + (i + 1) * 30;
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              const r = 80;
              const cx = 100;
              const cy = 95;

              const x1 = cx + r * Math.cos(startRad);
              const y1 = cy + r * Math.sin(startRad);
              const x2 = cx + r * Math.cos(endRad);
              const y2 = cy + r * Math.sin(endRad);

              return (
                <path
                  key={level}
                  d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                  fill={RISK_LEVEL_COLORS[level]}
                  opacity={i === currentIndex ? 1 : 0.3}
                  className="transition-opacity duration-300"
                />
              );
            })}
            {/* Needle */}
            {(() => {
              const needleAngle = 180 + currentIndex * 30 + 15;
              const needleRad = (needleAngle * Math.PI) / 180;
              const nx = 100 + 60 * Math.cos(needleRad);
              const ny = 95 + 60 * Math.sin(needleRad);
              return (
                <line
                  x1="100"
                  y1="95"
                  x2={nx}
                  y2={ny}
                  stroke="#1f2937"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              );
            })()}
            <circle cx="100" cy="95" r="5" fill="#1f2937" />
          </svg>
        </div>
      </div>

      {/* Current Level Display */}
      <div className="text-center mb-6">
        <div
          className="inline-block px-6 py-2 rounded-full text-white font-bold text-lg"
          style={{ backgroundColor: RISK_LEVEL_COLORS[value] }}
        >
          {value}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {RISK_LEVEL_DESCRIPTIONS[value]}
        </p>
      </div>

      {/* Slider */}
      <div className="px-2">
        <input
          type="range"
          min={0}
          max={SEBI_RISK_LEVELS.length - 1}
          value={currentIndex}
          onChange={(e) => onChange(SEBI_RISK_LEVELS[parseInt(e.target.value)])}
          className="w-full h-3 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${Object.values(RISK_LEVEL_COLORS).join(', ')})`,
          }}
        />
        <div className="flex justify-between mt-2">
          {SEBI_RISK_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => onChange(level)}
              className={`text-[9px] sm:text-[10px] leading-tight text-center px-0.5 transition-colors ${
                level === value
                  ? 'text-gray-900 font-bold'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              style={{ width: `${100 / SEBI_RISK_LEVELS.length}%` }}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
