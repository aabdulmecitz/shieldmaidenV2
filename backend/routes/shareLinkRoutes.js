const express = require('express');
const router = express.Router();
const shareLinkController = require('../controllers/shareLinkController');
const { authenticate } = require('../middleware/auth');
const { checkDatabase } = require('../middleware/dbCheck');

// Public Routes
router.get('/:token', checkDatabase, shareLinkController.getShareLinkInfo);

// Protected Routes
router.get('/my-links', authenticate, checkDatabase, shareLinkController.getMyShareLinks);
router.get('/stats', authenticate, checkDatabase, shareLinkController.getShareLinkStats);
router.put('/:id', authenticate, checkDatabase, shareLinkController.updateShareLink);
router.delete('/:id', authenticate, checkDatabase, shareLinkController.deactivateShareLink);

module.exports = router;
