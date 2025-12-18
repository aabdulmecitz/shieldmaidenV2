const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/fileUpload');
const { checkDatabase } = require('../middleware/dbCheck');

// Public Download Routes (Protected by Token in URL)
router.get('/download/:token', checkDatabase, fileController.downloadFile);
router.get('/info/:token', checkDatabase, fileController.getFileInfo);

// Protected Routes (User)
router.post('/upload', authenticate, checkDatabase, upload.single('file'), fileController.uploadFile);
router.get('/my-files', authenticate, checkDatabase, fileController.getMyFiles);
router.get('/:id', authenticate, checkDatabase, fileController.getFileDetails);
router.delete('/:id', authenticate, checkDatabase, fileController.deleteFile);

// Share Link Management
router.post('/:fileId/share', authenticate, checkDatabase, fileController.createShareLink);
router.get('/:fileId/shares', authenticate, checkDatabase, fileController.getFileShareLinks);

module.exports = router;

