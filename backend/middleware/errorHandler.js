/**
 * Error Handler Middleware
 * Tüm hataları yakalar ve standardize edilmiş response döner
 */
const { createErrorResponse } = require('../utils/responseHelper');
const mongoose = require('mongoose');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Console'a hata logla
  console.error('❌ Error Handler:', {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // MongoDB connection errors
  if (err.name === 'MongoServerError' || err.name === 'MongoNetworkError' || err.name === 'MongooseError') {
    const dbStatus = mongoose.connection.readyState;
    if (dbStatus !== 1) {
      return res.status(503).json(createErrorResponse(
        'Database connection unavailable',
        'Database connection is not available. Please try again later.'
      ));
    }
  }

  // Mongoose connection timeout
  if (err.message && (err.message.includes('connection') || err.message.includes('timeout'))) {
    return res.status(503).json(createErrorResponse(
      'Database connection timeout',
      'Database connection timeout. Please try again later.'
    ));
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = 'Validation error';
    const errors = Object.values(err.errors).map(val => val.message);
    return res.status(400).json(createErrorResponse(message, Array.isArray(errors) ? errors.join(', ') : errors));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const message = 'Duplicate entry';
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
    return res.status(409).json(createErrorResponse(message, `${field} already exists`));
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = 'Invalid ID format';
    return res.status(400).json(createErrorResponse(message));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    return res.status(401).json(createErrorResponse(message));
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    return res.status(401).json(createErrorResponse(message));
  }

  // Check if response was already sent
  if (res.headersSent) {
    return next(err);
  }

  // Default error
  const message = error.message || 'Server error';
  const statusCode = error.statusCode || res.statusCode || 500;

  res.status(statusCode).json(createErrorResponse(
    message,
    process.env.NODE_ENV === 'development' ? err.stack : undefined
  ));
};

module.exports = errorHandler;