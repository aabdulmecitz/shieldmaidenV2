const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');
const { checkDatabase } = require('../middleware/dbCheck');

// Public Routes
router.post('/register', authLimiter, checkDatabase, userController.register);
router.post('/login', authLimiter, checkDatabase, userController.login);

// Protected Routes
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.put('/encryption-keys', authenticate, userController.updateEncryptionKeys);

module.exports = router;
