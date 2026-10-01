import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  X,
  Trash2,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Ban,
  ArrowUpRight,
  ClipboardList,
} from 'lucide-react';
import { readHistory, QueueHistoryEntry } from '../hooks/useQueueHistory';

interface QueueHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
  onRemove: (id: string) => void;
  currentTokenId?: string;
}

function StatusBadge({ status }: { status: QueueHistoryEntry['status'] }) {
  const map: Record<
    QueueHistoryEntry['status'],
    { label: string; className: string; icon: React.ReactNode }
  > = {
    WAITING: {
      label: 'Waiting',
      className: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    SERVING: {
      label: 'Being Served',
      className: 'bg-brand-500/15 text-brand-300 border-brand-500/30',
      icon: <Clock className="w-3 h-3" />,
    },
    COMPLETED: {
      label: 'Completed',
      className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    HOLD: {
      label: 'On Hold',
      className: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
      icon: <AlertCircle className="w-3 h-3" />,
    },
    NO_SHOW: {
      label: 'No Show',
      className: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      icon: <Ban className="w-3 h-3" />,
    },
    CANCELLED: {
      label: 'Cancelled',
      className: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      icon: <Ban className="w-3 h-3" />,
    },
  };

  const s = map[status] ?? map.WAITING;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.className}`}
    >
      {s.icon} {s.label}
    </span>
  );
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

export const QueueHistoryDrawer: React.FC<QueueHistoryDrawerProps> = ({
  isOpen,
  onClose,
  onClear,
  onRemove,
  currentTokenId,
}) => {
  const [history, setHistory] = useState<QueueHistoryEntry[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);

  // Refresh history whenever drawer opens
  useEffect(() => {
    if (isOpen) {
      setHistory(readHistory());
      setConfirmClear(false);
    }
  }, [isOpen]);

  const handleRemove = (id: string) => {
    onRemove(id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const handleClear = () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    onClear();
    setHistory([]);
    setConfirmClear(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer — slides up from bottom on mobile, right panel on desktop */}
      <aside
        className="fixed bottom-0 left-0 right-0 sm:left-auto sm:top-0 sm:right-0 sm:bottom-0 sm:w-96 z-50
          flex flex-col rounded-t-3xl sm:rounded-none sm:rounded-l-3xl
          shadow-2xl overflow-hidden"
        style={{ background: '#061409', border: '1px solid rgba(34,197,94,0.15)' }}
        role="dialog"
        aria-label="Queue history"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'rgba(34,197,94,0.12)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Queue History</h2>
              <p className="text-[10px] text-slate-400">
                {history.length} {history.length === 1 ? 'visit' : 'visits'} saved
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={handleClear}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  confirmClear
                    ? 'bg-rose-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:text-rose-300 hover:bg-rose-950/40'
                }`}
                title="Clear all history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {confirmClear ? 'Confirm Clear?' : 'Clear All'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              aria-label="Close history"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center space-y-3">
              <ClipboardList className="w-12 h-12 text-brand-900/60" />
              <div>
                <p className="text-sm font-semibold text-slate-400">No history yet</p>
                <p className="text-xs text-slate-600 mt-1">
                  Queues you track will automatically appear here.
                </p>
              </div>
            </div>
          ) : (
            history.map((entry) => {
              const isCurrent = entry.tokenId === currentTokenId;
              return (
                <div
                  key={entry.id}
                  className={`rounded-2xl border p-4 transition-all group ${
                    isCurrent
                      ? 'border-brand-500/40 bg-brand-950/30'
                      : 'border-white/6 bg-white/3 hover:border-brand-900/60 hover:bg-brand-950/20'
                  }`}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-white truncate">
                          {entry.tokenNumber}
                          {isCurrent && (
                            <span className="ml-2 text-[10px] font-bold text-brand-400 bg-brand-500/10 border border-brand-500/30 px-1.5 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{entry.tenantName}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemove(entry.id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-950/40 text-slate-600 hover:text-rose-400 transition-all shrink-0"
                      title="Remove from history"
                      aria-label={`Remove ${entry.tokenNumber} from history`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Service & Status */}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-400 truncate flex-1">{entry.serviceName}</p>
                    <StatusBadge status={entry.status} />
                  </div>

                  {/* Footer row */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-slate-600">
                      {formatRelativeTime(entry.visitedAt)}
                    </span>

                    {!isCurrent && (
                      <Link
                        to={`/queue/${entry.tenantSlug}/${entry.tokenId}`}
                        onClick={onClose}
                        className="flex items-center gap-1 text-[11px] font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        Open <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div
          className="px-5 py-3 border-t text-center"
          style={{ borderColor: 'rgba(34,197,94,0.10)' }}
        >
          <p className="text-[10px] text-slate-600">
            History is saved privately on this device only.
          </p>
        </div>
      </aside>
    </>
  );
};
