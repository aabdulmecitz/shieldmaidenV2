const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directories exist
const tempDir = path.join(__dirname, '../uploads/temp');
const encryptedDir = path.join(__dirname, '../uploads/encrypted');

[tempDir, encryptedDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // We use a temporary name, the controller will process and rename/move it
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter - Allow all files
const fileFilter = (req, file, cb) => {
  cb(null, true);
};

// Upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB
  },
  fileFilter: fileFilter
});

module.exports = upload;

