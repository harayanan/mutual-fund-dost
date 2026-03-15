'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, Loader2, ChevronDown, ChevronUp, IndianRupee, Shield, PieChart, TrendingUp, AlertTriangle, MessageCircle, Lightbulb, Quote, Send, Bot, User } from 'lucide-react';
import type { AdvisorPlan } from '@/lib/client-planner/engine';

function formatDuration(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

export default function PlannerPage() {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [transcript, setTranscript] = useState<string | null>(null);
  const [plan, setPlan] = useState<AdvisorPlan | null>(null);
  const [error, setError] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'advisor'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus' : 'audio/webm',
      });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch {
      setError('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType });
        mr.stream.getTracks().forEach(t => t.stop());
        processAudio(blob);
      };
      mr.stop();
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processAudio(file);
    e.target.value = '';
  };

  const processAudio = async (audio: Blob | File) => {
    setProcessing(true);
    setProcessingStage('Transcribing audio...');
    setPlan(null);
    setTranscript(null);
    setError('');

    const formData = new FormData();
    formData.append('audio', audio);

    try {
      setProcessingStage('Transcribing & building plan...');
      const res = await fetch('/api/planner', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      const data = await res.json();
      setTranscript(data.transcript);
      setPlan(data.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setProcessing(false);
      setProcessingStage('');
    }
  };

  const reset = () => {
    setPlan(null);
    setTranscript(null);
    setError('');
    setShowTranscript(false);
    setChatMessages([]);
    setChatInput('');
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;

    const newMessages = [...chatMessages, { role: 'user' as const, text: msg }];
    setChatMessages(newMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/planner/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          currentPlan: plan,
          chatHistory: newMessages,
        }),
      });
      if (!res.ok) throw new Error('Chat failed');
      const data = await res.json();

      setChatMessages([...newMessages, { role: 'advisor', text: data.reply }]);
      if (data.updated_plan) {
        setPlan(data.updated_plan);
      }
    } catch {
      setChatMessages([...newMessages, { role: 'advisor', text: 'Sorry, something went wrong. Try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Client Planner</h1>
        <p className="text-sm text-gray-500 mt-1">
          Record a client conversation or dictate notes. AI builds the investment plan.
        </p>
      </div>

      {/* Audio Input */}
      {!plan && !processing && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          {recording ? (
            <div>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              </div>
              <p className="text-2xl font-mono font-bold text-gray-900 mb-1">{formatDuration(duration)}</p>
              <p className="text-sm text-red-600 mb-6">Recording...</p>
              <button
                onClick={stopRecording}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors inline-flex items-center gap-2"
              >
                <Square className="w-4 h-4 fill-current" />
                Stop & Analyze
              </button>
            </div>
          ) : (
            <div>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="w-7 h-7 text-blue-600" />
              </div>
              <p className="text-gray-700 mb-6">
                Talk about your client — their age, income, goals, risk appetite, existing investments.
                <br />
                <span className="text-gray-400 text-sm">Even partial info works. The engine fills in the gaps.</span>
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={startRecording}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  Record
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Audio
                </button>
                <input ref={fileRef} type="file" accept="audio/*" onChange={handleFile} className="hidden" />
              </div>
            </div>
          )}
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        </div>
      )}

      {/* Processing */}
      {processing && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-medium">{processingStage}</p>
          <p className="text-sm text-gray-400 mt-2">This takes 30-60 seconds</p>
        </div>
      )}

      {/* Results */}
      {plan && (
        <div className="space-y-4">
          {/* New conversation button */}
          <div className="flex justify-end">
            <button onClick={reset} className="text-sm text-blue-600 hover:underline">
              + New conversation
            </button>
          </div>

          {/* Transcript toggle */}
          {transcript && (
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600 hover:bg-gray-100"
            >
              <span>Transcript</span>
              {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          {showTranscript && transcript && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto">
              {transcript}
            </div>
          )}

          {/* Client Snapshot */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Client Snapshot</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {Object.entries(plan.client_snapshot.facts_extracted).map(([key, val]) => {
                if (!val || key === 'other') return null;
                if (key === 'goals' && Array.isArray(val)) {
                  return val.length > 0 ? (
                    <div key={key} className="col-span-2">
                      <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                      <p className="text-gray-900">{val.join(', ')}</p>
                    </div>
                  ) : null;
                }
                return (
                  <div key={key}>
                    <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                    <p className="text-gray-900">{val as string}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-3">Profile completeness: {plan.client_snapshot.profile_completeness}</p>

            {/* Key quotes */}
            {plan.client_snapshot.key_quotes.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1">
                  <Quote className="w-3 h-3" /> Key quotes
                </p>
                {plan.client_snapshot.key_quotes.map((q, i) => (
                  <p key={i} className="text-xs text-gray-500 italic">&ldquo;{q}&rdquo;</p>
                ))}
              </div>
            )}
          </div>

          {/* Risk Assessment */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-blue-600" />
              Risk Assessment
            </h2>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {plan.risk_assessment.sebi_level}
              </span>
              <span className="text-xs text-gray-400">
                Confidence: {plan.risk_assessment.confidence}
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {plan.risk_assessment.behavioral_narrative}
            </p>
            {plan.risk_assessment.assumptions_made.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-amber-600 font-medium">Assumptions:</p>
                <ul className="text-xs text-amber-600 list-disc list-inside">
                  {plan.risk_assessment.assumptions_made.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Asset Allocation */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <PieChart className="w-4 h-4 text-blue-600" />
              Asset Allocation
            </h2>
            <div className="flex gap-6 mb-3">
              {(['equity', 'debt', 'hybrid'] as const).map(type => (
                <div key={type} className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{plan.asset_allocation[type]}%</p>
                  <p className="text-xs text-gray-500 capitalize">{type}</p>
                </div>
              ))}
            </div>
            {/* Visual bar */}
            <div className="flex h-3 rounded-full overflow-hidden mb-3">
              <div className="bg-blue-500" style={{ width: `${plan.asset_allocation.equity}%` }} />
              <div className="bg-emerald-500" style={{ width: `${plan.asset_allocation.debt}%` }} />
              <div className="bg-amber-500" style={{ width: `${plan.asset_allocation.hybrid}%` }} />
            </div>
            <div className="flex gap-4 text-xs text-gray-500 mb-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full" />Equity</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full" />Debt</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-full" />Hybrid</span>
            </div>
            <p className="text-sm text-gray-600">{plan.asset_allocation.reasoning}</p>
          </div>

          {/* Fund Recommendations */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Fund Recommendations
            </h2>
            <div className="space-y-3">
              {plan.fund_recommendations.map((rec, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <p className="font-medium text-gray-900">{rec.fund_name}</p>
                      <p className="text-xs text-gray-500">
                        {rec.sub_category} &middot;
                        <span className={`ml-1 ${rec.role === 'core' ? 'text-blue-600' : 'text-purple-600'}`}>
                          {rec.role === 'core' ? 'Core' : 'Satellite'}
                        </span>
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-lg font-bold text-blue-600">{rec.allocation_percent}%</p>
                      <p className="text-xs text-gray-500 flex items-center justify-end gap-0.5">
                        <IndianRupee className="w-3 h-3" />
                        {rec.monthly_sip.toLocaleString('en-IN')}/mo
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{rec.rationale}</p>
                </div>
              ))}
            </div>
          </div>

          {/* SIP Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-blue-900 flex items-center gap-2">
                <IndianRupee className="w-4 h-4" />
                Total Monthly SIP
              </h2>
              <p className="text-2xl font-bold text-blue-900">
                ₹{plan.sip_summary.total_monthly.toLocaleString('en-IN')}
              </p>
            </div>
            <p className="text-sm text-blue-700">{plan.sip_summary.sanity_check}</p>
            {plan.sip_summary.step_up_suggestion && (
              <p className="text-xs text-blue-600 mt-1">{plan.sip_summary.step_up_suggestion}</p>
            )}
          </div>

          {/* Gaps */}
          {plan.gaps_for_next_conversation.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Ask Next Time
              </h2>
              <div className="space-y-2">
                {plan.gaps_for_next_conversation.map((gap, i) => (
                  <div key={i} className={`rounded-lg p-3 flex items-start gap-2 ${
                    gap.priority === 'high' ? 'bg-red-50 text-red-800' :
                    gap.priority === 'medium' ? 'bg-yellow-50 text-yellow-800' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    <MessageCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium uppercase">{gap.area}</p>
                      <p className="text-sm">&ldquo;{gap.question}&rdquo;</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advisor Notes */}
          {plan.advisor_notes && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
              <h2 className="font-semibold text-indigo-900 flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4" />
                Advisor Notes
              </h2>
              <p className="text-sm text-indigo-800">{plan.advisor_notes}</p>
            </div>
          )}

          {/* Chat with Advisor */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                <Bot className="w-4 h-4 text-blue-600" />
                Refine the Plan
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                &ldquo;What if income is 20L?&rdquo; &ldquo;Swap mid-cap for flexi cap&rdquo; &ldquo;He also has 5L in PPF&rdquo;
              </p>
            </div>

            {/* Chat messages */}
            {chatMessages.length > 0 && (
              <div className="max-h-80 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex items-start gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
                    {m.role === 'advisor' && (
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {m.text}
                    </div>
                    {m.role === 'user' && (
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="bg-gray-100 rounded-lg px-3 py-2">
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* Chat input */}
            <div className="p-3 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                placeholder="Ask a question or suggest a change..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={chatLoading}
              />
              <button
                onClick={sendChat}
                disabled={!chatInput.trim() || chatLoading}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 text-center py-4">
            Mutual fund investments are subject to market risks. Read all scheme related documents carefully.
            Past performance is not indicative of future results.
          </p>
        </div>
      )}
    </div>
  );
}
