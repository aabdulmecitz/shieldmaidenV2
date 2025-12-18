const File = require('../models/File');
const ShareLink = require('../models/ShareLink');
const User = require('../models/User');
const { generateKeys, encryptFileStream } = require('../utils/encryption');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * FileService
 * Business logic for file operations
 * Follows Single Responsibility Principle
 */
class FileService {
    constructor() {
        this.TEMP_DIR = path.join(__dirname, '../uploads/temp');
        this.ENCRYPTED_DIR = path.join(__dirname, '../uploads/encrypted');
        this._ensureDirectories();
    }

    /**
     * Ensure upload directories exist
     * @private
     */
    _ensureDirectories() {
        [this.TEMP_DIR, this.ENCRYPTED_DIR].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * Upload and encrypt a file
     * @param {Object} fileData - Multer file object
     * @param {String} userId - Owner user ID
     * @returns {Promise<Object>} Created file document
     */
    async uploadFile(fileData, userId) {
        const { originalname, size, path: tempPath, mimetype } = fileData;

        // Check user storage quota
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const storageQuota = parseInt(process.env.STORAGE_QUOTA_PER_USER) || 1073741824; // 1GB default
        if (user.storageUsed + size > storageQuota) {
            // Cleanup temp file
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            throw new Error('Storage quota exceeded');
        }

        try {
            // Generate encryption keys
            const { key, iv } = generateKeys();

            // Define encrypted file path
            const fileUuid = uuidv4();
            const encryptedFilename = `${fileUuid}.enc`;
            const encryptedPath = path.join(this.ENCRYPTED_DIR, encryptedFilename);

            // Encrypt file
            await encryptFileStream(tempPath, encryptedPath, key, iv);

            // Create database record
            const newFile = await File.create({
                originalName: originalname,
                mimetype,
                size,
                path: encryptedPath,
                filename: encryptedFilename,
                encryption: {
                    algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-ctr',
                    key,
                    iv
                },
                owner: userId
            });

            // Cleanup temp file
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

            // Update user storage
            await User.findByIdAndUpdate(userId, {
                $inc: {
                    'stats.totalFilesUploaded': 1,
                    storageUsed: size
                }
            });

            return newFile;

        } catch (error) {
            // Cleanup on error
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            throw error;
        }
    }

    /**
     * Get file by ID with owner check
     * @param {String} fileId - File ID
     * @param {String} userId - User ID
     * @param {Boolean} adminOverride - Admin can access any file
     * @returns {Promise<Object>} File document
     */
    async getFileById(fileId, userId, adminOverride = false) {
        const file = await File.findById(fileId);

        if (!file) {
            throw new Error('File not found');
        }

        if (!adminOverride && file.owner.toString() !== userId.toString()) {
            throw new Error('Access denied');
        }

        return file;
    }

    /**
     * Get user's files
     * @param {String} userId - User ID
     * @param {Object} options - Query options (limit, skip, sort)
     * @returns {Promise<Array>} Array of file documents
     */
    async getUserFiles(userId, options = {}) {
        const {
            limit = 50,
            skip = 0,
            sort = { createdAt: -1 }
        } = options;

        return File.find({ owner: userId, isDeleted: { $ne: true } })
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .select('-encryption.key -encryption.iv'); // Don't expose encryption keys
    }

    /**
     * Delete file (soft delete)
     * @param {String} fileId - File ID
     * @param {String} userId - User ID
     * @param {Boolean} adminOverride - Admin can delete any file
     * @returns {Promise<void>}
     */
    async deleteFile(fileId, userId, adminOverride = false) {
        const file = await this.getFileById(fileId, userId, adminOverride);

        // Deactivate all share links
        await ShareLink.updateMany(
            { fileId: file._id, isActive: true },
            {
                isActive: false,
                deactivatedAt: new Date(),
                deactivationReason: 'file_deleted'
            }
        );

        // Delete physical file
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        // Soft delete in database
        file.isDeleted = true;
        file.deletedAt = new Date();
        await file.save();

        // Update user storage
        await User.findByIdAndUpdate(file.owner, {
            $inc: {
                storageUsed: -file.size,
                'stats.totalFilesUploaded': -1
            }
        });
    }

    /**
     * Get all files (admin only)
     * @param {Object} filters - Query filters
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} Files and total count
     */
    async getAllFiles(filters = {}, options = {}) {
        const {
            limit = 50,
            skip = 0,
            sort = { createdAt: -1 }
        } = options;

        const query = { isDeleted: { $ne: true }, ...filters };

        const [files, total] = await Promise.all([
            File.find(query)
                .populate('owner', 'username email displayName')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .select('-encryption.key -encryption.iv'),
            File.countDocuments(query)
        ]);

        return { files, total, page: Math.floor(skip / limit) + 1, limit };
    }

    /**
     * Check if file exists on disk
     * @param {String} fileId - File ID
     * @returns {Promise<Boolean>}
     */
    async verifyFileIntegrity(fileId) {
        const file = await File.findById(fileId);
        if (!file) return false;
        return fs.existsSync(file.path);
    }
}

module.exports = new FileService();
