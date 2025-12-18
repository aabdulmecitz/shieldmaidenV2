const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');
const { checkDatabase } = require('../middleware/dbCheck');

// User Dashboard
router.get('/user', authenticate, checkDatabase, dashboardController.getUserDashboard);

// Admin Dashboard
router.get('/admin', authenticate, authorize('admin'), checkDatabase, dashboardController.getAdminDashboard);

// Metrics and Analytics
router.get('/metrics', authenticate, checkDatabase, dashboardController.getMetrics);
router.get('/downloads', authenticate, checkDatabase, dashboardController.getDownloadHistory);

// Geo Distribution (Admin only)
router.get('/geo', authenticate, authorize('admin'), checkDatabase, dashboardController.getGeoDistribution);

module.exports = router;
