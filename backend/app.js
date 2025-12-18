const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { requestLogger } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/security');
const apiRoutes = require('./routes');
const fs = require('fs');
const { startCleanupJob } = require('./cron');

// Start the cleanup job immediately
startCleanupJob();

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Environment variables
require('dotenv').config();

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser
app.use(express.json({ limit: '50mb' })); // Increased limit for file uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// NOTE: Static serving of uploads is DISABLED for security. 
// Files must be accessed via the secure download endpoint.

// Root route
app.get('/', (req, res) => {
  res.status(200).send('Shieldmaiden Secure File Share API');
});

// Health check endpoint
app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const health = {
    status: 'ok',
    message: 'Shieldmaiden System Operational',
    database: {
      status: dbStates[dbStatus] || 'unknown',
      connected: dbStatus === 1
    },
    timestamp: new Date().toISOString()
  };

  res.status(200).json(health);
});

// Rate limiting
app.use('/api', apiLimiter);

// Request logging middleware
app.use(requestLogger);

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Error handling
app.use(errorHandler);

module.exports = app;
