'use client';

import { useState } from 'react';
import { RISK_QUESTIONS, scoreToRiskLevel, type SEBIRiskLevel } from '@/lib/advisor-engine';
import { ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';

interface RiskProfilerProps {
  onComplete: (riskLevel: SEBIRiskLevel, answers: Record<string, number>) => void;
  onSkip: () => void;
}

export default function RiskProfiler({ onComplete, onSkip }: RiskProfilerProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const question = RISK_QUESTIONS[currentQ];
  const totalQuestions = RISK_QUESTIONS.length;
  const progress = ((currentQ + 1) / totalQuestions) * 100;

  const handleSelect = (score: number) => {
    const newAnswers = { ...answers, [question.id]: score };
    setAnswers(newAnswers);

    if (currentQ < totalQuestions - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      // Calculate risk level
      const totalScore = Object.values(newAnswers).reduce(
        (sum, s) => sum + s,
        0
      );
      const riskLevel = scoreToRiskLevel(totalScore);
      onComplete(riskLevel, newAnswers);
    }
  };

  const handleBack = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Know Your Risk Profile
          </h2>
          <p className="text-sm text-gray-500">
            Answer {totalQuestions} quick questions to find funds matched to your
            temperament
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>
              Question {currentQ + 1} of {totalQuestions}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Step indicators */}
          <div className="flex justify-between mt-2">
            {RISK_QUESTIONS.map((_, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-colors ${
                  i < currentQ
                    ? 'bg-green-500 text-white'
                    : i === currentQ
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                {i < currentQ ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {question.question}
          </h3>
          <div className="space-y-3">
            {question.options.map((option) => (
              <button
                key={option.label}
                onClick={() => handleSelect(option.score)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:border-blue-400 hover:bg-blue-50 ${
                  answers[question.id] === option.score
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <span className="text-sm font-medium text-gray-800">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <button
            onClick={handleBack}
            disabled={currentQ === 0}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={onSkip}
            className="text-sm text-gray-400 hover:text-gray-600 underline"
          >
            Skip to slider
          </button>
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <ChevronRight className="w-4 h-4" />
            Select to continue
          </div>
        </div>
      </div>
    </div>
  );
}
