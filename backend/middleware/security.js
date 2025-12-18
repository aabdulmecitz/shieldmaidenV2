const rateLimit = require('express-rate-limit');

/**
 * Security Middleware
 * Rate limiting and other security configurations
 */

const isProd = process.env.NODE_ENV === 'production';

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 100 : 1000, // Relax limits in development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'Rate limit exceeded',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 5 : 1000, // Relax limits in development to avoid blocking
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    error: 'Rate limit exceeded',
    timestamp: new Date().toISOString(),
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Upload limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 uploads per hour
  message: {
    success: false,
    message: 'Too many uploads, please try again later.',
    error: 'Upload limit exceeded',
    timestamp: new Date().toISOString(),
  },
});

// AI identification limiter
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 AI requests per hour
  message: {
    success: false,
    message: 'Too many AI identification requests, please try again later.',
    error: 'AI rate limit exceeded',
    timestamp: new Date().toISOString(),
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  aiLimiter,
};

