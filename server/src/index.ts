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
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Initialize Socket.io
initSocket(server, CORS_ORIGIN);

// Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Create API Router for flexible path matching across Vercel serverless rewrites
const router = express.Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'QEase AI Server', timestamp: new Date().toISOString() });
});

// Authentication Routes
router.post('/auth/login', login);
router.get('/auth/me', authenticateStaff, getCurrentUser);

// Kiosk Routes
router.get('/kiosk/:tenantSlug/data', getKioskData);
router.post('/kiosk/tokens', issueToken);

// Business Dashboard Staff Routes (Auth Protected)
router.get('/admin/queue', authenticateStaff, getLiveQueue);
router.post('/admin/queue/next', authenticateStaff, advanceQueueNext);
router.patch('/admin/counters/status', authenticateStaff, toggleCounterStatus);
router.post('/admin/tokens/action', authenticateStaff, handleTokenAction);
router.get('/admin/analytics', authenticateStaff, getAnalytics);

// Customer Public Portal Routes
router.get('/public/tokens/:tenantSlug/:tokenId', publicApiRateLimiter, getPublicTokenStatus);
router.post('/public/tokens/ask-ai', askAiRateLimiter, askAiAssistant);

// Mount router on all path prefix variants to guarantee routing success on Vercel
app.use('/api/v1', router);
app.use('/v1', router);
app.use('/api', router);
app.use('/', router);

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
