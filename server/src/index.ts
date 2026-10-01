import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';

import { initSocket } from './lib/socket';
import { authenticateStaff } from './middleware/auth';
import { askAiRateLimiter, publicApiRateLimiter } from './middleware/rateLimiter';

import { login, getCurrentUser } from './controllers/authController';
import { getKioskData, issueToken } from './controllers/kioskController';
import {
  getLiveQueue,
  advanceQueueNext,
  toggleCounterStatus,
  handleTokenAction,
  getAnalytics,
} from './controllers/adminController';
import { getPublicTokenStatus, askAiAssistant } from './controllers/publicController';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Initialize Socket.io
initSocket(server, CORS_ORIGIN);

// Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'WaitWise AI Server', timestamp: new Date().toISOString() });
});

// Authentication Routes
app.post('/api/v1/auth/login', login);
app.get('/api/v1/auth/me', authenticateStaff, getCurrentUser);

// Kiosk Routes
app.get('/api/v1/kiosk/:tenantSlug/data', getKioskData);
app.post('/api/v1/kiosk/tokens', issueToken);

// Business Dashboard Staff Routes (Auth Protected)
app.get('/api/v1/admin/queue', authenticateStaff, getLiveQueue);
app.post('/api/v1/admin/queue/next', authenticateStaff, advanceQueueNext);
app.patch('/api/v1/admin/counters/status', authenticateStaff, toggleCounterStatus);
app.post('/api/v1/admin/tokens/action', authenticateStaff, handleTokenAction);
app.get('/api/v1/admin/analytics', authenticateStaff, getAnalytics);

// Customer Public Portal Routes
app.get('/api/v1/public/tokens/:tenantSlug/:tokenId', publicApiRateLimiter, getPublicTokenStatus);
app.post('/api/v1/public/tokens/ask-ai', askAiRateLimiter, askAiAssistant);

export default app;
export { app, server };

if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 QEase AI Backend running on http://localhost:${PORT}`);
    console.log(`⚡ WebSocket Server online (Socket.io room broadcasting)`);
    console.log(`🤖 Gemini AI Engine active`);
    console.log(`=======================================================`);
  });
}
