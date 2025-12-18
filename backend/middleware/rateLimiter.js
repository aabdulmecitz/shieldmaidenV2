const rateLimit = require('express-rate-limit');

/**
 * Rate Limiting Middleware
 * Different rate limits for different endpoint types
 */

// Get configuration from environment
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000; // 15 minutes
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

/**
 * General API Rate Limiter
 */
exports.apiLimiter = rateLimit({
    windowMs: WINDOW_MS,
    max: MAX_REQUESTS,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(WINDOW_MS / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Use Redis store in production for distributed rate limiting
    // store: new RedisStore({ client: redisClient })
});

/**
 * Strict Rate Limiter for File Uploads
 */
exports.uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 uploads per hour
    message: {
        success: false,
        message: 'Upload limit exceeded. Please try again later.',
        retryAfter: 3600
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false
});

/**
 * Moderate Rate Limiter for Downloads
 */
exports.downloadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 downloads per 15 minutes
    message: {
        success: false,
        message: 'Download limit exceeded. Please try again later.',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Strict Rate Limiter for Authentication
 */
exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again later.',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // Don't count successful logins
});

/**
 * Very Strict Rate Limiter for Admin Operations
 */
exports.adminLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    message: {
        success: false,
        message: 'Admin operation rate limit exceeded.',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = exports;
