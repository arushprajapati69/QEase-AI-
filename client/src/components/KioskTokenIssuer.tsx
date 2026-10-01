import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Building2,
  Printer,
  Sparkles,
  CheckCircle2,
  Clock,
  FileCheck,
  User,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

import { apiGetKioskData, apiIssueToken } from '../lib/api';

export const KioskTokenIssuer: React.FC = () => {
  const { tenantSlug = 'abc-bank' } = useParams<{ tenantSlug: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kioskData, setKioskData] = useState<any>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [isIssuing, setIsIssuing] = useState(false);
  const [issuedTicket, setIssuedTicket] = useState<any>(null);

  const fetchKioskDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiGetKioskData(tenantSlug);
      if (res.success) {
        setKioskData(res);
        if (res.services?.length > 0) {
          setSelectedServiceId(res.services[0].id);
        }
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load kiosk service catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKioskDetails();
  }, [tenantSlug]);

  const handleIssueTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || isIssuing) return;

    try {
      setIsIssuing(true);
      const res = await apiIssueToken({
        tenantSlug,
        serviceTypeId: selectedServiceId,
        customerName: customerName.trim() || undefined,
      });

      if (res.success && res.data) {
        setIssuedTicket(res.data);
        setCustomerName('');
      } else {
        throw new Error(res.message || 'Failed to generate token');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to issue token');
    } finally {
      setIsIssuing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-400">Loading service options...</p>
      </div>
    );
  }

  if (error || !kioskData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="glass-card max-w-md p-6 rounded-3xl text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Kiosk Connection Error</h2>
          <p className="text-xs text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  const selectedService = kioskData.services?.find((s: any) => s.id === selectedServiceId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left: Service Selection & Form */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border-slate-800 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">Reception — Get Your Token</h1>
              <p className="text-xs text-slate-400">{kioskData.tenant?.name}</p>
            </div>
          </div>

          <form onSubmit={handleIssueTokenSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                1. Select Service Type
              </label>

              <div className="space-y-2.5">
                {kioskData.services?.map((service: any) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setSelectedServiceId(service.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      selectedServiceId === service.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                        : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold">{service.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Average duration: ~{service.avgDurationMin} min
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedServiceId === service.id
                          ? 'border-indigo-400 bg-indigo-500 text-white'
                          : 'border-slate-700'
                      }`}
                    >
                      {selectedServiceId === service.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                2. Your Name (Optional)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {selectedService && (
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-2">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-indigo-400" /> Required Documents for {selectedService.name}:
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedService.requiredDocs?.map((doc: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-900/60 text-indigo-300 text-[11px] font-medium"
                    >
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isIssuing || !selectedServiceId}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-brand-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-base tracking-wide shadow-xl shadow-indigo-600/30 border border-indigo-400/40 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
            >
              {isIssuing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Issuing Digital Token...
                </>
              ) : (
                <>
                  <Printer className="w-5 h-5" /> Get My Queue Token
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Printed Token / Live QR Preview */}
        <div className="flex flex-col items-center justify-center">
          {issuedTicket ? (
            <div className="w-full max-w-sm bg-slate-900 text-slate-100 p-6 rounded-3xl border-2 border-indigo-500/50 shadow-2xl space-y-5 text-center relative overflow-hidden animate-pulse-slow">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-teal-400 to-indigo-500" />

              <div className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                {issuedTicket.token?.tenantName}
              </div>

              <div>
                <div className="text-5xl font-black tracking-tight text-white">
                  {issuedTicket.token?.tokenNumber}
                </div>
                <p className="text-xs text-indigo-300 font-semibold mt-1">
                  {issuedTicket.service?.name}
                </p>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-4 rounded-2xl inline-block shadow-lg mx-auto">
                <QRCodeSVG
                  value={`${window.location.origin}/queue/${tenantSlug}/${issuedTicket.token?.tokenNumber.toLowerCase()}`}
                  size={160}
                  level="H"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                  <Sparkles className="w-4 h-4" /> Scan QR Code with Smartphone
                </p>
                <p className="text-[11px] text-slate-400">
                  Track live position & AI wait updates anywhere outside the branch.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Position: #{issuedTicket.token?.positionInQueue} in Queue</span>
                <Link
                  to={`/queue/${tenantSlug}/${issuedTicket.token?.tokenNumber.toLowerCase()}`}
                  target="_blank"
                  className="text-indigo-400 font-semibold flex items-center gap-1 hover:underline"
                >
                  Open Mobile View <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setIssuedTicket(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                Issue Another Token
              </button>
            </div>
          ) : (
            <div className="glass-card p-8 rounded-3xl border-slate-800 text-center space-y-4 max-w-sm">
              <QrCode className="w-16 h-16 text-indigo-400/50 mx-auto" />
              <h3 className="text-lg font-bold text-white">Ready to Issue Token</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose a service on the left, then tap <strong className="text-slate-300">Get My Queue Token</strong>. A QR code will appear here for the customer to scan.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
