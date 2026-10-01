import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Clock,
  QrCode,
  LayoutDashboard,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

interface NavbarProps {
  user?: any;
  onLogout?: () => void;
}

/** QEase AI — Professional gradient "Q" lettermark logo */
const QEaseLogo: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="QEase AI logo"
  >
    <defs>
      <linearGradient id="qease-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4ade80" />
        <stop offset="60%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#16a34a" />
      </linearGradient>
      <linearGradient id="qease-inner" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#bbf7d0" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#22c55e" stopOpacity="0.05" />
      </linearGradient>
      <filter id="qease-glow">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    {/* Rounded square background */}
    <rect width="40" height="40" rx="10" fill="url(#qease-grad)" />
    <rect width="40" height="40" rx="10" fill="url(#qease-inner)" />
    {/* Bold "Q" lettermark */}
    <text
      x="20"
      y="28"
      fontFamily="Outfit, sans-serif"
      fontWeight="800"
      fontSize="24"
      textAnchor="middle"
      fill="white"
      filter="url(#qease-glow)"
    >
      Q
    </text>
    {/* Small tick accent on Q tail */}
    <line x1="25" y1="26" x2="30" y2="31" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname.startsWith(path) && path !== '/';
  const isHome = location.pathname === '/';

  const customerLinks = [
    { to: '/track', label: 'Track My Queue', icon: <Clock className="w-4 h-4 text-brand-400" /> },
    { to: '/kiosk/abc-bank',         label: 'Get a Token',    icon: <QrCode className="w-4 h-4 text-emerald-400" /> },
  ];

  const staffLinks = [
    { to: '/admin/dashboard',  label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 text-brand-400" /> },
    { to: '/admin/analytics',  label: 'Analytics', icon: <BarChart3 className="w-4 h-4 text-emerald-400" /> },
  ];

  const navLinks = user ? staffLinks : customerLinks;

  const linkBase = 'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all';
  const linkActive = 'bg-brand-600/20 text-brand-300 border border-brand-500/30';
  const linkIdle = 'text-slate-300 hover:bg-white/5 hover:text-white';

  return (
    <nav className="sticky top-0 z-40 glass-panel border-b border-brand-900/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="group-hover:scale-105 transition-transform duration-300 drop-shadow-lg">
              <QEaseLogo size={38} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-brand-300 via-emerald-200 to-brand-400 bg-clip-text text-transparent">
                  QEase
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-black bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded-md uppercase tracking-widest">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
                {user
                  ? `${user.role} · ${user.tenantName || 'Staff Portal'}`
                  : 'Queue made effortless'}
              </p>
            </div>
          </Link>

          {/* ── Desktop Nav ── */}
          <div className="hidden md:flex items-center space-x-1">
            {!user && (
              <Link
                to="/"
                className={`${linkBase} ${isHome ? linkActive : linkIdle}`}
              >
                Home
              </Link>
            )}
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`${linkBase} ${isActive(link.to) ? linkActive : linkIdle}`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Auth / User ── */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                <div className="hidden sm:flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-300 text-xs font-black uppercase">
                    {user.name?.charAt(0) || 'S'}
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-semibold text-slate-200 leading-tight">{user.name}</div>
                    <div className="text-[10px] text-brand-400 font-medium uppercase tracking-wide">{user.role}</div>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  id="btn-logout"
                  className="p-2 rounded-lg bg-white/5 hover:bg-rose-900/30 hover:text-rose-300 text-slate-400 transition-colors border border-white/10"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/auth/login"
                id="btn-staff-login"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all"
              >
                Staff Login <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white border border-white/10 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-brand-900/40 bg-[#030f07]/98 backdrop-blur-xl px-4 py-4 space-y-1">
          {!user && (
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${isHome ? 'bg-brand-600/20 text-brand-300' : 'text-slate-300 hover:bg-white/5'}`}
            >
              Home
            </Link>
          )}
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive(link.to) ? 'bg-brand-600/20 text-brand-300' : 'text-slate-300 hover:bg-white/5'}`}
            >
              {link.icon} {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-brand-900/40">
            {!user ? (
              <Link
                to="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-all"
              >
                Staff Login <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                onClick={() => { onLogout?.(); setMobileOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/30 transition-all"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
