'use client';

import { MessageCircle, Sparkles } from 'lucide-react';
import type { ConversationStarter } from '@/lib/gemini';

interface ConversationStartersProps {
  starters: ConversationStarter[];
}

export default function ConversationStarters({ starters }: ConversationStartersProps) {
  if (!starters || starters.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-purple-600" />
        <h2 className="text-lg font-bold text-gray-900">Conversation Starters</h2>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
          Proactive outreach topics
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {starters.map((starter, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">
                  {starter.topic}
                </h3>

                <div className="mb-3">
                  <p className="text-xs text-purple-600 font-medium mb-1">Try saying:</p>
                  <p className="text-sm text-gray-700 italic bg-white/60 rounded-lg px-3 py-2 border border-purple-100">
                    &ldquo;{starter.opener}&rdquo;
                  </p>
                </div>

                <div className="mb-2">
                  <p className="text-xs text-gray-500 font-medium mb-1">Key Point:</p>
                  <p className="text-sm text-gray-700">
                    {starter.keyPoint}
                  </p>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                  <p className="text-xs text-green-700">
                    <span className="font-medium">Client Benefit:</span> {starter.clientBenefit}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
