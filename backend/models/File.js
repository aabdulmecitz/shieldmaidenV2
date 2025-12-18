const mongoose = require('mongoose');

/**
 * File Schema
 * Shieldmaiden - Secure File Sharing
 * Simplified model - access control handled by ShareLink
 */
const fileSchema = new mongoose.Schema({
    // File Identity
    originalName: {
        type: String,
        required: true,
        trim: true
    },
    encoding: String,
    mimetype: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },

    // System Storage
    path: {
        type: String,
        required: true
    },
    filename: { // The name on disk (uuid)
        type: String,
        required: true,
        unique: true
    },

    // Security & Encryption
    encryption: {
        algorithm: {
            type: String,
            default: 'aes-256-ctr'
        },
        key: { // Encrypted Data Encryption Key (DEK)
            type: String,
            required: true,
            select: false // Do not return by default
        },
        iv: { // Initialization Vector
            type: String,
            required: true,
            select: false
        }
    },

    // Ownership
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Soft Delete
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },
    deletedAt: {
        type: Date,
        default: null
    }

}, {
    timestamps: true
});

// Indexes for faster lookup
fileSchema.index({ owner: 1, createdAt: -1 });
fileSchema.index({ filename: 1 });
fileSchema.index({ isDeleted: 1, owner: 1 });

// Pre-remove hook to delete physical file
fileSchema.pre('remove', function (next) {
    const fs = require('fs');
    if (fs.existsSync(this.path)) {
        try {
            fs.unlinkSync(this.path);
        } catch (err) {
            console.error('Error deleting file:', err);
        }
    }
    next();
});

// Virtual: File size in human-readable format
fileSchema.virtual('sizeFormatted').get(function () {
    const bytes = this.size;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
});

// Ensure virtuals are included
fileSchema.set('toJSON', { virtuals: true });
fileSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('File', fileSchema);

