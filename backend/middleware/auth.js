const jwt = require('jsonwebtoken');
const { createErrorResponse } = require('../utils/responseHelper');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(createErrorResponse(
        'Authentication required',
        'Please provide a valid authentication token'
      ));
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'dev-secret-change-in-production'
      );

      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json(createErrorResponse(
          'Authentication failed',
          'User not found'
        ));
      }

      req.user = user;
      req.userId = user._id; // Keep for backward compatibility
      next();
    } catch (error) {
      console.error('JWT Verify Error:', error.message);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json(createErrorResponse(
          'Token expired',
          'Your session has expired. Please login again'
        ));
      }
      return res.status(401).json(createErrorResponse(
        'Invalid token',
        'Authentication token is invalid'
      ));
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json(createErrorResponse(
      'Authentication error',
      'Internal server error during authentication'
    ));
  }
};

/**
 * Role-based Authorization Middleware
 * @param  {...String} roles - Allowed roles (e.g. 'admin', 'user')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(createErrorResponse('Unauthorized', 'User not authenticated'));
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json(createErrorResponse(
        'Forbidden',
        'You do not have permission to perform this action'
      ));
    }
    next();
  };
};

/**
 * Optional Authentication Middleware
 * Attaches user if token is present, but doesn't fail if missing
 * Useful for endpoints that work for both authenticated and anonymous users
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'dev-secret-change-in-production'
      );

      const user = await User.findById(decoded.userId).select('-password');
      if (user) {
        req.user = user;
        req.userId = user._id;
      }
    } catch (error) {
      // Token invalid or expired, but we don't fail - just continue without user
      console.log('Optional auth - invalid token:', error.message);
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    // Don't fail on error, just continue
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};

