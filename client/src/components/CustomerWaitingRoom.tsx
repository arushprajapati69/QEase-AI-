import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Clock,
  Users,
  Building2,
  Sparkles,
  Bot,
  MapPin,
  CheckCircle,
  AlertCircle,
  BellRing,
  RefreshCw,
  ChevronRight,
  ArrowLeft,
  CalendarDays,
  FileCheck,
  History,
} from 'lucide-react';

import { useSocket } from '../hooks/useSocket';
import { useQueueHistory } from '../hooks/useQueueHistory';
import { apiGetPublicTokenStatus } from '../lib/api';
import { PrepChecklist } from './PrepChecklist';
import { AskAiChatModal } from './AskAiChatModal';
import { QueueHistoryDrawer } from './QueueHistoryDrawer';

export const CustomerWaitingRoom: React.FC = () => {
  const { tenantSlug = 'abc-bank', tokenId = '' } = useParams<{ tenantSlug: string; tokenId: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [turnNotificationTriggered, setTurnNotificationTriggered] = useState(false);

  const { isConnected } = useSocket(data?.tenant?.id, data?.token?.id);

  // ── History hook: auto-records this visit ──
  const historyEntry = data
    ? {
        tokenNumber: data.token?.tokenNumber ?? tokenId,
        tokenId,
        tenantSlug,
        tenantName: data.tenant?.name ?? tenantSlug,
        serviceName: data.service?.name ?? 'Service',
        status: data.token?.status ?? 'WAITING',
      }
    : null;

  const { clearHistory, removeEntry } = useQueueHistory(historyEntry);

  const loadTokenState = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiGetPublicTokenStatus(tenantSlug, tokenId);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        throw new Error(res.message || 'Token details not found.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to queue server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTokenState();
  }, [tenantSlug, tokenId]);

  // Turn Notification Trigger when people ahead <= 2 or SERVING
  useEffect(() => {
    if (data?.token) {
      const { peopleAhead, status } = data.token;
      if ((peopleAhead <= 2 || status === 'SERVING') && !turnNotificationTriggered) {
        setTurnNotificationTriggered(true);
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 300]);
        }
        if (status === 'SERVING') {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        }
      }
    }
  }, [data?.token, turnNotificationTriggered]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#030f07' }}>
        <div className="w-12 h-12 rounded-2xl bg-brand-600/20 border border-brand-500/40 flex items-center justify-center text-brand-400 animate-spin mb-4">
          <RefreshCw className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-slate-400">Loading your queue status...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: '#030f07' }}>
        <div className="glass-card max-w-md w-full p-6 rounded-3xl text-center space-y-4 border-rose-500/30">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Queue Token Not Found</h2>
          <p className="text-xs text-slate-400">{error || 'The requested token URL is invalid or expired.'}</p>
          <div className="flex flex-col gap-3">
            <Link
              to={`/kiosk/${tenantSlug}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Get a New Token
            </Link>
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-colors"
            >
              <History className="w-4 h-4 text-brand-400" /> View My Past Queues
            </button>
          </div>
        </div>

        {/* History drawer available even on error */}
        <QueueHistoryDrawer
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onClear={clearHistory}
          onRemove={removeEntry}
        />
      </div>
    );
  }

  const { tenant, token, service, prediction } = data;
  const isServing   = token.status === 'SERVING';
  const isCompleted = token.status === 'COMPLETED';
  const isNearTurn  = token.peopleAhead <= 2 && !isServing && !isCompleted;

  return (
    <div className="min-h-screen text-slate-100 pb-28 selection:bg-brand-500/30" style={{ backgroundColor: '#030f07' }}>

      {/* ── Sticky Header ── */}
      <header
        className="glass-panel sticky top-0 z-30 px-4 py-3 border-b flex items-center justify-between"
        style={{ borderColor: 'rgba(34,197,94,0.12)' }}
      >
        <div className="flex items-center gap-2.5">
          <Link
            to="/"
            className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 hover:bg-brand-600/30 transition-colors"
            title="Back to Home"
          >
            <Building2 className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xs font-bold text-white">{tenant.name}</h1>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-brand-400 animate-ping' : 'bg-slate-500'}`} />
              <span>{isConnected ? 'Queue is live' : 'Reconnecting...'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* History button */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            id="btn-history"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-300 hover:bg-brand-500/20 transition-colors text-xs font-semibold"
            title="View queue history"
            aria-label="Open queue history"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">History</span>
          </button>

          <button
            onClick={loadTokenState}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
            title="Refresh"
            aria-label="Refresh queue status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-5 space-y-5">

        {/* ── Near-Turn Alert ── */}
        {isNearTurn && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-2 border-amber-500/50 text-amber-200 animate-pulse shadow-lg shadow-amber-500/10 space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <BellRing className="w-5 h-5 text-amber-400 animate-bounce" />
              <span>RETURN TO BRANCH IMMEDIATELY</span>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              Only {token.peopleAhead} {token.peopleAhead === 1 ? 'person' : 'people'} ahead of you! Please take your place in the counter waiting area.
            </p>
          </div>
        )}

        {/* ── Serving Alert ── */}
        {isServing && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-500/30 to-emerald-500/30 border-2 border-brand-400 text-white shadow-xl shadow-brand-500/20 space-y-1 text-center">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-300">YOUR TURN HAS ARRIVED</div>
            <h2 className="text-2xl font-extrabold text-white">PROCEED TO {token.assignedCounter || 'COUNTER 1'}</h2>
            <p className="text-xs text-brand-100">Please present your prepared documents to the teller.</p>
          </div>
        )}

        {/* ── Token Badge ── */}
        <div
          className="glass-panel p-6 rounded-3xl shadow-2xl relative overflow-hidden text-center space-y-4"
          style={{ border: '1px solid rgba(34,197,94,0.15)' }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/8 rounded-full blur-2xl pointer-events-none" />

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-400">
            <Clock className="w-3.5 h-3.5 text-brand-400" />
            Token Issued: {new Date(token.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          <div>
            <div className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-brand-300 bg-clip-text text-transparent">
              {token.tokenNumber}
            </div>
            <p className="text-sm font-medium text-slate-300 mt-1">{service.name}</p>
          </div>

          {/* Queue position stats */}
          <div className="pt-2">
            {!isServing && !isCompleted ? (
              <div className="bg-white/4 border border-white/8 rounded-2xl p-4 flex items-center justify-around">
                <div>
                  <div className="text-3xl font-extrabold text-brand-400">{token.peopleAhead}</div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                    {token.peopleAhead === 1 ? 'Person Ahead' : 'People Ahead'}
                  </div>
                </div>
                <div className="h-10 w-px bg-white/10" />
                <div>
                  <div className="text-xl font-bold text-emerald-400">
                    {prediction.estimatedWaitMinLower}–{prediction.estimatedWaitMinUpper}{' '}
                    <span className="text-xs font-medium">min</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                    AI Estimated Wait
                  </div>
                </div>
              </div>
            ) : isServing ? (
              <div className="bg-brand-950/40 border border-brand-500/30 rounded-2xl p-4 text-brand-300 font-bold text-sm">
                Active Turn • Serving at {token.assignedCounter}
              </div>
            ) : (
              <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-2xl p-4 text-center space-y-1">
                <div className="text-emerald-400 font-bold text-sm">✓ Service Completed</div>
                <div className="text-xs text-slate-400">Thank you for visiting. Have a great day!</div>
              </div>
            )}
          </div>

          {/* Return time */}
          {!isServing && !isCompleted && (
            <div className="flex items-center justify-between text-xs text-slate-400 px-2 pt-1">
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 text-brand-400" /> Expected Turn:
              </span>
              <span className="font-semibold text-slate-200">~ {prediction.recommendedReturnTime}</span>
            </div>
          )}
        </div>

        {/* ── Mobility Guidance ── */}
        {!isServing && !isCompleted && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
              prediction.canLeavePremises
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-white/3 border-white/8 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${prediction.canLeavePremises ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Can I leave the premises?</div>
                <div className="text-sm font-bold mt-0.5">
                  {prediction.canLeavePremises ? 'YES — You can step out safely' : 'NO — Please remain in branch'}
                </div>
              </div>
            </div>
            <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wider ${prediction.canLeavePremises ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
              {prediction.canLeavePremises ? 'Step Out' : 'Stay Nearby'}
            </span>
          </div>
        )}

        {/* ── AI Status Summary ── */}
        {!isServing && !isCompleted && (
          <div className="p-4 rounded-2xl glass-card text-xs leading-relaxed text-slate-300 flex items-start gap-2.5" style={{ border: '1px solid rgba(34,197,94,0.10)' }}>
            <Sparkles className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <span>{prediction.statusSummary}</span>
          </div>
        )}

        {/* ── Document Checklist ── */}
        <PrepChecklist
          serviceName={service.name}
          requiredDocs={service.requiredDocs}
          preliminaryWarning={service.preliminaryWarning}
        />
      </div>

      {/* ── Floating Ask AI Button ── */}
      {!isCompleted && (
        <div className="fixed bottom-5 right-5 z-40">
          <button
            onClick={() => setIsAiModalOpen(true)}
            id="btn-ask-ai"
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-500 hover:from-brand-600 hover:to-emerald-400 text-white font-bold text-sm shadow-2xl shadow-brand-500/40 border border-brand-400/30 transform hover:scale-105 active:scale-95 transition-all"
            aria-label="Ask AI Assistant a question"
          >
            <Bot className="w-5 h-5" />
            <span>Ask a Question</span>
          </button>
        </div>
      )}

      {/* ── Ask AI Chat Drawer ── */}
      <AskAiChatModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        tokenId={token.id}
        tokenNumber={token.tokenNumber}
      />

      {/* ── Queue History Drawer ── */}
      <QueueHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onClear={clearHistory}
        onRemove={removeEntry}
        currentTokenId={tokenId}
      />
    </div>
  );
};
