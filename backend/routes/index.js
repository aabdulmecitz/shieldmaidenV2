const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const fileRoutes = require('./fileRoutes');
const shareLinkRoutes = require('./shareLinkRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const adminRoutes = require('./adminRoutes');

// Health Check
router.get('/health', async (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState;
  const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

  res.json({
    success: true,
    message: 'ShieldMaiden Security Systems Operational',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStates[dbStatus] || 'unknown',
      connected: dbStatus === 1
    }
  });
});

// Mount Routes
router.use('/auth', authRoutes);
router.use('/files', fileRoutes);
router.use('/share', shareLinkRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/admin', adminRoutes);

module.exports = router;

