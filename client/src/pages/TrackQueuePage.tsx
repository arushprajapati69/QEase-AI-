import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Clock,
  History,
  ArrowUpRight,
  Loader2,
  CheckCircle,
  Ban,
  QrCode,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { readHistory, QueueHistoryEntry } from '../hooks/useQueueHistory';

function StatusDot({ status }: { status: QueueHistoryEntry['status'] }) {
  const map: Record<QueueHistoryEntry['status'], { color: string; icon: React.ReactNode }> = {
    WAITING:   { color: 'text-amber-400',   icon: <Loader2 className="w-3.5 h-3.5 animate-spin" /> },
    SERVING:   { color: 'text-brand-400',   icon: <Clock className="w-3.5 h-3.5" /> },
    COMPLETED: { color: 'text-emerald-400', icon: <CheckCircle className="w-3.5 h-3.5" /> },
    HOLD:      { color: 'text-slate-400',   icon: <Clock className="w-3.5 h-3.5" /> },
    NO_SHOW:   { color: 'text-rose-400',    icon: <Ban className="w-3.5 h-3.5" /> },
    CANCELLED: { color: 'text-rose-400',    icon: <Ban className="w-3.5 h-3.5" /> },
  };
  const s = map[status] ?? map.WAITING;
  return <span className={s.color}>{s.icon}</span>;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24)  return `${hrs}h ago`;
  return `${days}d ago`;
}

export const TrackQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState('');
  const [history, setHistory] = useState<QueueHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = tokenInput.trim().replace(/\s+/g, '').toUpperCase();
    if (!cleaned) {
      setError('Please enter your token number.');
      return;
    }
    // Token numbers look like TOKEN-47 or TOKEN47 — normalise to lowercase slug
    const slug = cleaned.toLowerCase().replace('-', '');
    navigate(`/queue/abc-bank/${slug}`);
  };

  return (
    <div
      className="min-h-screen text-slate-100 flex flex-col items-center justify-start pt-12 pb-20 px-4"
      style={{ backgroundColor: '#030f07' }}
    >
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[260px] bg-brand-600/15 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-md w-full space-y-8 relative z-10">

        {/* ── Header ── */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center mx-auto shadow-xl shadow-brand-500/25">
            <Search className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Track My Queue</h1>
          <p className="text-sm text-slate-400">
            Enter the token number from your receipt to see your live queue position.
          </p>
        </div>

        {/* ── Lookup Form ── */}
        <form
          onSubmit={handleLookup}
          className="glass-panel rounded-3xl p-6 space-y-4"
          style={{ border: '1px solid rgba(34,197,94,0.15)' }}
        >
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Your Token Number
          </label>

          <div className="relative">
            <Clock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              id="token-input"
              type="text"
              value={tokenInput}
              onChange={(e) => { setTokenInput(e.target.value); setError(''); }}
              placeholder="e.g. TOKEN-47"
              autoFocus
              autoComplete="off"
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              style={{
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(34,197,94,0.18)',
              }}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-400 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </div>
          )}

          <button
            type="submit"
            id="btn-track-token"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-500 hover:from-brand-600 hover:to-emerald-400 text-white font-extrabold text-sm shadow-lg shadow-brand-600/25 border border-brand-500/30 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
          >
            <Search className="w-4 h-4" /> Find My Queue Position
          </button>

          <p className="text-center text-[11px] text-slate-500">
            Don't have a token?{' '}
            <Link to="/kiosk/abc-bank" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
              Get one at reception →
            </Link>
          </p>
        </form>

        {/* ── Recent Queue History ── */}
        {history.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                <History className="w-4 h-4 text-brand-400" />
                Recent Queues
              </div>
              <span className="text-[11px] text-slate-500">{history.length} saved on this device</span>
            </div>

            <div className="space-y-2.5">
              {history.map((entry) => {
                const isActive = entry.status === 'WAITING' || entry.status === 'SERVING';
                return (
                  <Link
                    key={entry.id}
                    to={`/queue/${entry.tenantSlug}/${entry.tokenId}`}
                    className="flex items-center justify-between p-4 rounded-2xl border group transition-all hover:border-brand-500/40"
                    style={{
                      background: 'rgba(34,197,94,0.04)',
                      borderColor: 'rgba(34,197,94,0.12)',
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.18)' }}
                      >
                        <StatusDot status={entry.status} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-extrabold text-white">{entry.tokenNumber}</span>
                          {isActive && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-brand-500/15 text-brand-300 border border-brand-500/30 rounded-full uppercase tracking-wider">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate mt-0.5">
                          <span className="truncate">{entry.serviceName}</span>
                          <span className="text-slate-600">·</span>
                          <span className="shrink-0">{formatRelativeTime(entry.visitedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-brand-400 group-hover:text-brand-300 shrink-0 ml-2 transition-colors">
                      <span className="text-xs font-semibold hidden sm:inline">Open</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Scan QR hint ── */}
        <div
          className="flex items-start gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.10)' }}
        >
          <QrCode className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-300">Tip:</span> The easiest way to track your queue is to scan the QR code on your token receipt — it opens this page automatically with your token pre-loaded.
          </p>
        </div>
      </div>
    </div>
  );
};
