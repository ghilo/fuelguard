import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: 15,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login attempts per hour
  message: {
    error: 'Too many login attempts, please try again after an hour.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Strict rate limiter for registration
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 registrations per hour
  message: {
    error: 'Too many registration attempts, please try again later.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for QR scanning (station operators)
export const scanLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Allow 30 scans per minute
  message: {
    error: 'Too many scan requests, please slow down.',
    retryAfter: 1,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for sensitive admin operations
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 admin operations per minute
  message: {
    error: 'Too many admin requests, please slow down.',
    retryAfter: 1,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for exports (heavy operations)
export const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 exports per hour
  message: {
    error: 'Export limit reached, please try again later.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
