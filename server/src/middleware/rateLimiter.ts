import rateLimit from 'express-rate-limit';

// Rate limiter for "Ask AI" endpoint (10 requests per minute per IP / token)
export const askAiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Rate limit exceeded: Maximum 10 AI assistant queries allowed per minute.',
  },
});

// General public API rate limiter (60 requests per minute)
export const publicApiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again in a minute.',
  },
});
