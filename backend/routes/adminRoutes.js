const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const { checkDatabase } = require('../middleware/dbCheck');

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));
router.use(checkDatabase);

// User Management
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/status', adminController.toggleUserStatus);

// File Management
router.get('/files', adminController.getAllFiles);

// Audit and Monitoring
router.get('/audit', adminController.getAuditLogs);
router.get('/health', adminController.getSystemHealth);

module.exports = router;
