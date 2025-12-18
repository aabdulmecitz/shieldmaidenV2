const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * ShareLink Schema
 * ShieldMaiden - Secure File Sharing System
 * 
 * Tek kullanımlık veya limitli paylaşım linkleri
 */
const shareLinkSchema = new mongoose.Schema({
    // References
    fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: [true, 'Dosya referansı zorunludur'],
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Oluşturan kullanıcı zorunludur'],
        index: true
    },

    // Share Token (URL-safe unique identifier)
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Access Type
    accessType: {
        type: String,
        enum: ['single', 'multiple', 'unlimited'],
        default: 'multiple',
        required: true
    },

    // Download Limits
    downloadLimit: {
        type: Number,
        default: 10,
        min: [1, 'İndirme limiti en az 1 olmalıdır'],
        max: [1000, 'İndirme limiti en fazla 1000 olabilir']
    },
    downloadCount: {
        type: Number,
        default: 0
    },

    // Expiration
    expiresAt: {
        type: Date,
        required: [true, 'Son kullanma tarihi zorunludur'],
        index: true
    },

    // Optional Password Protection
    password: {
        type: String, // Hashed password
        default: null
    },
    isPasswordProtected: {
        type: Boolean,
        default: false
    },

    // Status
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    deactivatedAt: {
        type: Date,
        default: null
    },
    deactivationReason: {
        type: String,
        enum: ['manual', 'expired', 'limit_reached', 'file_deleted', 'admin'],
        default: null
    },

    // Access Control
    allowedIPs: [{
        type: String // Optional IP whitelist
    }],
    allowedEmails: [{
        type: String,
        lowercase: true
    }],
    requiresAuth: {
        type: Boolean,
        default: false // If true, only logged-in users can access
    },

    // Statistics & Tracking
    lastAccessedAt: {
        type: Date,
        default: null
    },
    lastAccessIP: {
        type: String,
        default: null
    },

    // Custom Message (shown to downloader)
    customMessage: {
        type: String,
        maxlength: [500, 'Mesaj en fazla 500 karakter olabilir'],
        default: ''
    },

    // Notification Settings
    notifyOnDownload: {
        type: Boolean,
        default: false
    },
    notificationEmail: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Compound Indexes
shareLinkSchema.index({ fileId: 1, isActive: 1 });
shareLinkSchema.index({ createdBy: 1, isActive: 1, createdAt: -1 });
shareLinkSchema.index({ expiresAt: 1, isActive: 1 }); // For cleanup

// Virtual: Full share URL
shareLinkSchema.virtual('shareUrl').get(function () {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${baseUrl}/share/${this.token}`;
});

// Virtual: Is expired
shareLinkSchema.virtual('isExpired').get(function () {
    return new Date() > this.expiresAt;
});

// Virtual: Is limit reached
shareLinkSchema.virtual('isLimitReached').get(function () {
    if (this.accessType === 'unlimited') return false;
    if (this.accessType === 'single') return this.downloadCount >= 1;
    return this.downloadCount >= this.downloadLimit;
});

// Virtual: Can be used
shareLinkSchema.virtual('canBeUsed').get(function () {
    return this.isActive && !this.isExpired && !this.isLimitReached;
});

// Virtual: Remaining downloads
shareLinkSchema.virtual('remainingDownloads').get(function () {
    if (this.accessType === 'unlimited') return Infinity;
    if (this.accessType === 'single') return Math.max(0, 1 - this.downloadCount);
    return Math.max(0, this.downloadLimit - this.downloadCount);
});

// Virtual: Time until expiration
shareLinkSchema.virtual('expiresIn').get(function () {
    const diff = this.expiresAt - new Date();
    if (diff <= 0) return 'Süresi doldu';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} gün ${hours} saat`;
    if (hours > 0) return `${hours} saat ${minutes} dakika`;
    return `${minutes} dakika`;
});

// Ensure virtuals are included
shareLinkSchema.set('toJSON', { virtuals: true });
shareLinkSchema.set('toObject', { virtuals: true });

// Static: Generate unique token
shareLinkSchema.statics.generateToken = function (length = 32) {
    return crypto.randomBytes(length).toString('base64url');
};

// Static: Find by token
shareLinkSchema.statics.findByToken = function (token) {
    return this.findOne({ token, isActive: true })
        .populate('fileId')
        .populate('createdBy', 'username displayName email');
};

// Static: Find active links by file
shareLinkSchema.statics.findByFile = function (fileId) {
    return this.find({ fileId, isActive: true })
        .sort({ createdAt: -1 });
};

// Static: Find links by user
shareLinkSchema.statics.findByUser = function (userId, options = {}) {
    const query = { createdBy: userId };
    if (options.activeOnly) query.isActive = true;

    return this.find(query)
        .populate('fileId', 'originalName size mimeType')
        .sort({ createdAt: -1 });
};

// Static: Find expired links for cleanup
shareLinkSchema.statics.findExpiredLinks = function () {
    return this.find({
        isActive: true,
        expiresAt: { $lt: new Date() }
    });
};

// Static: Get statistics
shareLinkSchema.statics.getStats = async function (userId = null) {
    const match = {};
    if (userId) match.createdBy = new mongoose.Types.ObjectId(userId);

    const stats = await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                totalLinks: { $sum: 1 },
                activeLinks: {
                    $sum: { $cond: ['$isActive', 1, 0] }
                },
                totalDownloads: { $sum: '$downloadCount' },
                avgDownloadsPerLink: { $avg: '$downloadCount' }
            }
        }
    ]);

    return stats[0] || { totalLinks: 0, activeLinks: 0, totalDownloads: 0, avgDownloadsPerLink: 0 };
};

// Instance: Check password
shareLinkSchema.methods.checkPassword = async function (password) {
    if (!this.isPasswordProtected || !this.password) return true;

    const bcrypt = require('bcryptjs');
    return bcrypt.compare(password, this.password);
};

// Instance: Record access
shareLinkSchema.methods.recordAccess = async function (ipAddress = null) {
    this.downloadCount += 1;
    this.lastAccessedAt = new Date();
    if (ipAddress) this.lastAccessIP = ipAddress;

    // Check if limit reached and deactivate
    if (this.accessType === 'single' ||
        (this.accessType === 'multiple' && this.downloadCount >= this.downloadLimit)) {
        this.isActive = false;
        this.deactivatedAt = new Date();
        this.deactivationReason = 'limit_reached';
    }

    return this.save();
};

// Instance: Deactivate
shareLinkSchema.methods.deactivate = async function (reason = 'manual') {
    this.isActive = false;
    this.deactivatedAt = new Date();
    this.deactivationReason = reason;
    return this.save();
};

// Pre-save: Generate token if not exists
shareLinkSchema.pre('save', function (next) {
    if (this.isNew && !this.token) {
        this.token = mongoose.model('ShareLink').generateToken();
    }

    // Set password protected flag
    this.isPasswordProtected = !!this.password;

    next();
});

module.exports = mongoose.model('ShareLink', shareLinkSchema);
