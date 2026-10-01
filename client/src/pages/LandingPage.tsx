import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  QrCode,
  Sparkles,
  Users,
  Building2,
  Smartphone,
  CheckCircle2,
  Bot,
  MapPin,
  BellRing,
  FileCheck,
  ChevronRight,
  History,
  ArrowUpRight,
  CheckCircle,
  Loader2,
  Ban,
} from 'lucide-react';
import { readHistory, QueueHistoryEntry } from '../hooks/useQueueHistory';

function StatusDot({ status }: { status: QueueHistoryEntry['status'] }) {
  const map: Record<QueueHistoryEntry['status'], { color: string; icon: React.ReactNode }> = {
    WAITING:   { color: 'text-amber-400',  icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    SERVING:   { color: 'text-brand-400',  icon: <Clock className="w-3 h-3" /> },
    COMPLETED: { color: 'text-emerald-400',icon: <CheckCircle className="w-3 h-3" /> },
    HOLD:      { color: 'text-slate-400',  icon: <Clock className="w-3 h-3" /> },
    NO_SHOW:   { color: 'text-rose-400',   icon: <Ban className="w-3 h-3" /> },
    CANCELLED: { color: 'text-rose-400',   icon: <Ban className="w-3 h-3" /> },
  };
  const s = map[status] ?? map.WAITING;
  return <span className={s.color}>{s.icon}</span>;
}

export const LandingPage: React.FC = () => {
  const [recentQueues, setRecentQueues] = useState<QueueHistoryEntry[]>([]);

  useEffect(() => {
    setRecentQueues(readHistory().slice(0, 3)); // show max 3 on landing
  }, []);
  return (
    <div className="min-h-screen text-slate-100" style={{backgroundColor:'#030f07'}}>

      {/* ── Hero ── */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[380px] bg-gradient-to-tr from-brand-600/25 via-emerald-500/15 to-brand-400/10 blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7 relative z-10">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>AI-Powered Virtual Queue — No App Needed</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            Skip the Wait.{' '}
            <span className="bg-gradient-to-r from-brand-400 via-emerald-300 to-brand-300 bg-clip-text text-transparent">
              Track Your Turn
            </span>{' '}
            from Anywhere.
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Get a digital token at the reception desk, then freely step out — grab a coffee,
            run an errand — and come back exactly when it's your turn.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/track"
              id="cta-track-queue"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-500 hover:from-brand-600 hover:to-emerald-400 text-white font-extrabold text-base tracking-wide shadow-xl shadow-brand-600/30 border border-brand-500/30 flex items-center justify-center gap-2 transform hover:scale-105 transition-all"
            >
              <Clock className="w-5 h-5" />
              Track My Queue Position
            </Link>

            <Link
              to="/kiosk/abc-bank"
              id="cta-get-token"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-panel hover:bg-brand-900/30 text-slate-200 font-bold text-base border border-brand-900/60 flex items-center justify-center gap-2 transition-all"
            >
              <QrCode className="w-5 h-5 text-cyan-400" />
              Get a Token at Reception
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> No app download required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Works on any smartphone
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Live position updates
            </span>
          </div>
        </div>
      </section>

      {/* ── How It Works (3 Steps) ── */}
      <section className="py-20 border-t border-slate-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-white">How It Works</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Three simple steps — from walking in to being called at the counter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connecting line on desktop */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-indigo-500/40 via-cyan-400/40 to-indigo-500/40" />

            {/* Step 1 */}
            <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-4 text-center relative">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto">
                <QrCode className="w-7 h-7" />
              </div>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-black flex items-center justify-center shadow-lg">
                1
              </div>
              <h3 className="text-base font-bold text-white">Get Your Token</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Arrive at the reception desk. Staff issue you a numbered token and a QR code — takes under 30 seconds.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-4 text-center relative">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                <Smartphone className="w-7 h-7" />
              </div>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-cyan-600 text-white text-xs font-black flex items-center justify-center shadow-lg">
                2
              </div>
              <h3 className="text-base font-bold text-white">Scan & Step Out</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scan the QR code with your phone. See your live position and AI-estimated wait time. Step out freely if you have enough time.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-4 text-center relative">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <BellRing className="w-7 h-7" />
              </div>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shadow-lg">
                3
              </div>
              <h3 className="text-base font-bold text-white">Return When Called</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your phone alerts you when only 2–3 people remain ahead. Return to the counter area and you'll be served right away.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Customer Benefits ── */}
      <section className="py-20 bg-slate-900/40 border-t border-slate-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-white">What You Get</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Everything you need to manage your visit without stress.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            <div className="glass-card p-5 rounded-2xl flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Live Wait Time Estimate</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  See a real-time estimate of how long until your turn, updated automatically as the queue moves.
                </p>
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Step Out Safely</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We tell you clearly whether you have enough time to grab a coffee, eat lunch, or run a quick errand nearby.
                </p>
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Document Checklist</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Know exactly which documents to have ready before you reach the counter — no surprises, no extra trips.
                </p>
              </div>
            </div>

            <div className="glass-card p-5 rounded-2xl flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">AI Assistant — Ask Anything</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Have a question about your wait or what to prepare? Tap "Ask AI" on your queue screen for an instant answer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Where We're Used ── */}
      <section className="py-20 border-t border-slate-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-white">QEase AI Powers Many Services</h2>
            <p className="text-slate-400 text-sm">One simple system — everywhere you wait.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl text-center space-y-2 hover:border-brand-500/40 transition-colors">
              <Building2 className="w-7 h-7 text-indigo-400 mx-auto" />
              <div className="text-sm font-bold text-white">Banks</div>
              <div className="text-[11px] text-slate-400">Account services, loans & KYC</div>
            </div>

            <div className="glass-card p-5 rounded-2xl text-center space-y-2 hover:border-emerald-500/40 transition-colors">
              <Users className="w-7 h-7 text-emerald-400 mx-auto" />
              <div className="text-sm font-bold text-white">Clinics</div>
              <div className="text-[11px] text-slate-400">Urgent care & outpatient</div>
            </div>

            <div className="glass-card p-5 rounded-2xl text-center space-y-2 hover:border-cyan-500/40 transition-colors">
              <Building2 className="w-7 h-7 text-cyan-400 mx-auto" />
              <div className="text-sm font-bold text-white">Government</div>
              <div className="text-[11px] text-slate-400">DMV, licensing & tax</div>
            </div>

            <div className="glass-card p-5 rounded-2xl text-center space-y-2 hover:border-amber-500/40 transition-colors">
              <Smartphone className="w-7 h-7 text-amber-400 mx-auto" />
              <div className="text-sm font-bold text-white">Telecom</div>
              <div className="text-[11px] text-slate-400">Service & retail centres</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Recent Queues (returning visitors) ── */}
      {recentQueues.length > 0 && (
        <section className="py-14 border-t" style={{ borderColor: 'rgba(34,197,94,0.12)' }}>
          <div className="max-w-2xl mx-auto px-4 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white">Recent Queues</h2>
                  <p className="text-[11px] text-slate-500">Saved on this device</p>
                </div>
              </div>
              <Link
                to="/track"
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 transition-colors"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentQueues.map((entry) => {
                const isActive = entry.status === 'WAITING' || entry.status === 'SERVING';
                return (
                  <Link
                    key={entry.id}
                    to={`/queue/${entry.tenantSlug}/${entry.tokenId}`}
                    className="flex items-center justify-between p-4 rounded-2xl border transition-all hover:border-brand-500/40 group"
                    style={{ background: 'rgba(34,197,94,0.04)', borderColor: 'rgba(34,197,94,0.12)' }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
                        <StatusDot status={entry.status} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-white">{entry.tokenNumber}</span>
                          {isActive && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-brand-500/15 text-brand-300 border border-brand-500/30 rounded-full uppercase tracking-wider">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {entry.serviceName} · {entry.tenantName}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-brand-400 group-hover:text-brand-300 shrink-0 ml-2 transition-colors">
                      <span className="text-xs font-semibold">Resume</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Final CTA ── */}
      <section className="py-16 border-t" style={{ borderColor: 'rgba(34,197,94,0.10)' }}>
        <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {recentQueues.length > 0 ? 'Join a New Queue' : 'Already have a token?'}
          </h2>
          <p className="text-slate-400 text-sm">
            {recentQueues.length > 0
              ? 'Visit a reception desk to get a fresh token for a new visit.'
              : 'Open your queue tracking screen right now — no login, no account needed.'}
          </p>

          {recentQueues.length === 0 && (
            <Link
              to="/track"
              id="cta-track-bottom"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-500 hover:from-brand-600 hover:to-emerald-400 text-white font-extrabold text-base shadow-xl shadow-brand-600/30 border border-brand-500/30 transform hover:scale-105 transition-all"
            >
              <Clock className="w-5 h-5" /> Track My Queue Position <ChevronRight className="w-4 h-4" />
            </Link>
          )}

          <Link
            to="/kiosk/abc-bank"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl glass-panel text-slate-300 font-semibold text-sm border hover:text-white transition-all"
            style={{ borderColor: 'rgba(34,197,94,0.15)' }}
          >
            <QrCode className="w-4 h-4 text-brand-400" /> Get a New Token at Reception
          </Link>

          {/* Staff separator */}
          <div className="pt-4 border-t" style={{ borderColor: 'rgba(34,197,94,0.08)' }}>
            <p className="text-[11px] text-slate-500">
              Are you staff?{' '}
              <Link to="/auth/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
                Sign in to Staff Portal →
              </Link>
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
