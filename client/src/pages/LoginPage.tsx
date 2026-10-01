import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Clock, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { apiLogin } from '../lib/api';

interface LoginPageProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('teller1@abcbank.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiLogin({ email, password });
      if (res.success && res.token) {
        localStorage.setItem('waitwise_token', res.token);
        onLoginSuccess(res.user, res.token);
        navigate('/admin/dashboard');
      } else {
        throw new Error(res.message || 'Login failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4" style={{backgroundColor:'#030f07'}}>
      <div className="max-w-md w-full glass-panel p-8 rounded-3xl border-slate-800 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center mx-auto shadow-lg shadow-brand-500/20">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">QEase AI — Staff Sign-In</h1>
          <p className="text-xs text-slate-400">Access your branch's live queue management panel</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Staff Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#030f07] border border-brand-900/60 focus:border-brand-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#030f07] border border-brand-900/60 focus:border-brand-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-700 to-brand-600 hover:from-brand-600 hover:to-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-600/20 border border-brand-500/30 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="font-semibold text-slate-300 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Demo Credentials:
          </div>
          <div>Teller 1: <code className="text-indigo-300">teller1@abcbank.com</code> / <code className="text-indigo-300">password123</code></div>
          <div>Admin: <code className="text-indigo-300">admin@abcbank.com</code> / <code className="text-indigo-300">password123</code></div>
        </div>
      </div>
    </div>
  );
};
