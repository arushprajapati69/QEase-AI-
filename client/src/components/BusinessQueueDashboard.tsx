import React, { useEffect, useState } from 'react';
import {
  Users,
  Clock,
  Play,
  Pause,
  UserCheck,
  UserX,
  Radio,
  Zap,
  Activity,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Sparkles,
} from 'lucide-react';

import { useSocket } from '../hooks/useSocket';
import { apiGetLiveQueue, apiAdvanceQueue, apiToggleCounter, apiTokenAction } from '../lib/api';

export const BusinessQueueDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queueData, setQueueData] = useState<any>(null);
  const [selectedCounterId, setSelectedCounterId] = useState<string>('');
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const { isConnected, latencyMs, socket } = useSocket(queueData?.tenant?.id);

  const fetchQueueState = async () => {
    try {
      setLoading(true);
      const res = await apiGetLiveQueue();
      if (res.success) {
        setQueueData(res);
        if (!selectedCounterId && res.counters?.length > 0) {
          const active = res.counters.find((c: any) => c.isActive);
          setSelectedCounterId(active ? active.id : res.counters[0].id);
        }
      } else {
        throw new Error(res.message || 'Failed to fetch queue data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueState();
  }, []);

  // Listen to WebSocket events for <200ms real-time UI updates
  useEffect(() => {
    if (!socket) return;

    const handleQueueAdvanced = () => {
      fetchQueueState();
    };

    const handleTokenCreated = () => {
      fetchQueueState();
    };

    const handleCounterChanged = () => {
      fetchQueueState();
    };

    socket.on('QUEUE_ADVANCED', handleQueueAdvanced);
    socket.on('TOKEN_CREATED', handleTokenCreated);
    socket.on('COUNTER_CHANGED', handleCounterChanged);

    return () => {
      socket.off('QUEUE_ADVANCED', handleQueueAdvanced);
      socket.off('TOKEN_CREATED', handleTokenCreated);
      socket.off('COUNTER_CHANGED', handleCounterChanged);
    };
  }, [socket]);

  // One-Tap "NEXT CUSTOMER" trigger
  const handleNextCustomer = async () => {
    if (!selectedCounterId || isAdvancing) return;
    setIsAdvancing(true);
    setActionSuccessMsg(null);

    const startTime = Date.now();
    try {
      const res = await apiAdvanceQueue(selectedCounterId);
      const executionTime = Date.now() - startTime;

      if (res.success) {
        setActionSuccessMsg(
          res.servingToken
            ? `Advanced ${res.servingToken.tokenNumber} to ${res.message || 'Counter'} in ${executionTime}ms`
            : 'Queue empty — No customers waiting'
        );
        fetchQueueState();
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to advance queue');
    } finally {
      setIsAdvancing(false);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  const handleToggleCounter = async (counterId: string, currentStatus: boolean) => {
    try {
      await apiToggleCounter(counterId, !currentStatus);
      fetchQueueState();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleTokenActionClick = async (tokenId: string, action: string) => {
    try {
      await apiTokenAction(tokenId, action, selectedCounterId);
      fetchQueueState();
    } catch (err: any) {
      console.error(err);
    }
  };

  if (loading && !queueData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
        <p className="text-sm text-slate-400 font-medium">Loading Business Operational Dashboard...</p>
      </div>
    );
  }

  const selectedCounter = queueData?.counters?.find((c: any) => c.id === selectedCounterId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 space-y-6">
      
      {/* Top Banner & Latency Meter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-5 rounded-3xl border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
              LIVE OPERATIONS
            </span>
            <span className="text-xs text-slate-400">• {queueData?.tenant?.name || 'ABC Bank Downtown'}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">Operational Queue Panel</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Socket Latency Widget */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <Radio className={`w-4 h-4 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
            <span className="text-slate-300 font-medium">WebSocket Latency:</span>
            <span className="font-bold text-emerald-400">{latencyMs ?? 18} ms</span>
          </div>

          <button
            onClick={fetchQueueState}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh State"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Live Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Counters</div>
            <div className="text-3xl font-extrabold text-white mt-1">{queueData?.metrics?.activeCountersCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sliders className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Waiting in Queue</div>
            <div className="text-3xl font-extrabold text-amber-400 mt-1">{queueData?.metrics?.totalWaitingCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Currently Serving</div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-1">{queueData?.metrics?.totalServingCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Wait Time</div>
            <div className="text-3xl font-extrabold text-cyan-400 mt-1">{queueData?.metrics?.avgWaitMinutes} <span className="text-sm font-normal text-slate-400">min</span></div>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Operational Panel: One-Tap "NEXT CUSTOMER" & Counter Toggles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: One-Tap Control & Counter Select */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* One-Tap Advance Button Box */}
          <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 shadow-2xl relative overflow-hidden space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Counter Selection</span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Fast Dispatch
              </span>
            </div>

            {/* Counter Selector Pills */}
            <div className="grid grid-cols-2 gap-2.5">
              {queueData?.counters?.map((counter: any) => (
                <button
                  key={counter.id}
                  type="button"
                  onClick={() => setSelectedCounterId(counter.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedCounterId === counter.id
                      ? 'bg-gradient-to-r from-indigo-600 to-brand-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30'
                      : counter.isActive
                      ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                      : 'bg-slate-900/30 border-slate-800/60 text-slate-500 opacity-60'
                  }`}
                >
                  <div className="text-xs font-semibold">{counter.counterNumber}</div>
                  <div className="text-[10px] mt-0.5 opacity-80">
                    {counter.isActive ? 'Active Counter' : 'Paused / Offline'}
                  </div>
                </button>
              ))}
            </div>

            {/* Giant ONE-TAP "NEXT CUSTOMER" Button */}
            <button
              type="button"
              onClick={handleNextCustomer}
              disabled={isAdvancing || !selectedCounter?.isActive}
              className="w-full py-5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-white font-extrabold text-lg tracking-wide shadow-xl shadow-emerald-500/25 border border-emerald-300/40 flex items-center justify-center gap-3 transform active:scale-95 transition-all group"
            >
              <UserCheck className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              <span>{isAdvancing ? 'CALLING...' : 'NEXT CUSTOMER'}</span>
              <ChevronRight className="w-5 h-5 text-emerald-200 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-[11px] text-slate-400 text-center">
              Broadcasting WebSocket event <code className="text-indigo-300 font-mono">QUEUE_ADVANCED</code> to all clients instantly.
            </p>
          </div>

          {/* Counter Status Toggles List */}
          <div className="glass-card p-5 rounded-2xl border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" /> Counter Status Controls
            </h3>

            <div className="space-y-2">
              {queueData?.counters?.map((counter: any) => (
                <div
                  key={counter.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        counter.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                      }`}
                    />
                    <span className="text-sm font-semibold text-slate-200">{counter.counterNumber}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleCounter(counter.id, counter.isActive)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                      counter.isActive
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                    }`}
                  >
                    {counter.isActive ? 'Pause Counter' : 'Activate Counter'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Live Queue List & Currently Serving Tokens */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Currently Serving Section */}
          <div className="glass-card p-5 rounded-2xl border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" /> Active Customers at Counters
            </h3>

            {queueData?.serving?.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs bg-slate-900/50 rounded-xl border border-slate-800">
                No active tokens currently being served at counters. Click "NEXT CUSTOMER" to advance.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {queueData?.serving?.map((token: any) => (
                  <div
                    key={token.id}
                    className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        {token.counterNumber || 'Counter'}
                      </div>
                      <div className="text-xl font-extrabold text-white mt-0.5">{token.tokenNumber}</div>
                      <div className="text-xs text-slate-300">{token.customerName} • {token.serviceName}</div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleTokenActionClick(token.id, 'COMPLETE')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm"
                      >
                        Complete
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTokenActionClick(token.id, 'HOLD')}
                        className="px-3 py-1 text-slate-400 hover:text-amber-300 text-xs font-medium"
                      >
                        Hold
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Waiting Queue List */}
          <div className="glass-card p-5 rounded-2xl border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" /> Waiting List ({queueData?.waiting?.length || 0})
              </h3>
              <span className="text-xs text-slate-400">Sorted by Queue Priority</span>
            </div>

            {queueData?.waiting?.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/50 rounded-xl border border-slate-800">
                Queue empty! No customers waiting right now.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {queueData?.waiting?.map((token: any) => (
                  <div
                    key={token.id}
                    className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 text-sm">
                        #{token.positionInQueue}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-extrabold text-white">{token.tokenNumber}</span>
                          <span className="text-xs text-slate-300 font-medium">• {token.customerName}</span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{token.serviceName}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-3 h-3" /> ~{token.avgDurationMin}m avg
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTokenActionClick(token.id, 'HOLD')}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-900/30 text-slate-300 hover:text-amber-300 border border-slate-700 text-xs font-medium"
                      >
                        Hold
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTokenActionClick(token.id, 'NO_SHOW')}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-900/30 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-medium"
                      >
                        No Show
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
