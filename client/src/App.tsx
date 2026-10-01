import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { KioskPage } from './pages/KioskPage';
import { DashboardPage } from './pages/DashboardPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { QueuePage } from './pages/QueuePage';
import { TrackQueuePage } from './pages/TrackQueuePage';
import { apiGetCurrentUser } from './lib/api';

export function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('waitwise_token');
        if (token) {
          const res = await apiGetCurrentUser();
          if (res.success && res.user) {
            setUser(res.user);
          }
        }
      } catch (err) {
        console.warn('Auth check skipped or token expired');
        localStorage.removeItem('waitwise_token');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLoginSuccess = (userData: any, token: string) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('waitwise_token');
    setUser(null);
  };

  return (
    <Router>
      <div className="min-h-screen text-slate-100 flex flex-col font-sans" style={{ backgroundColor: '#030f07' }}>
        <Navbar user={user} onLogout={handleLogout} />

        <main className="flex-1">
          <Routes>
            {/* Public routes */}
            <Route path="/"                                   element={<LandingPage />} />
            <Route path="/auth/login"                         element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/kiosk/:tenantSlug"                  element={<KioskPage />} />
            <Route path="/kiosk"                              element={<Navigate to="/kiosk/abc-bank" replace />} />

            {/* Track My Queue — token lookup page (no hardcoded token) */}
            <Route path="/track"                              element={<TrackQueuePage />} />

            {/* Actual queue status page — reached via QR code or lookup */}
            <Route path="/queue/:tenantSlug/:tokenId"         element={<QueuePage />} />

            {/* /queue with no params → lookup page */}
            <Route path="/queue"                              element={<Navigate to="/track" replace />} />

            {/* Staff-only routes */}
            <Route path="/admin/dashboard"                    element={<DashboardPage />} />
            <Route path="/admin/analytics"                    element={<AnalyticsPage />} />

            {/* Catch-all */}
            <Route path="*"                                   element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
