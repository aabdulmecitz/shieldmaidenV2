const mongoose = require('mongoose');

/**
 * DownloadLog Schema
 * ShieldMaiden - Secure File Sharing System
 * 
 * İndirme geçmişi ve denetim kaydı (audit trail)
 */
const downloadLogSchema = new mongoose.Schema({
    // References
    fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: [true, 'Dosya referansı zorunludur'],
        index: true
    },
    shareLinkId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ShareLink',
        default: null, // null = direct download by owner
        index: true
    },
    downloadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null, // null = anonymous download via share link
        index: true
    },

    // Request Details
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        default: ''
    },
    referer: {
        type: String,
        default: ''
    },

    // Geolocation (optional)
    location: {
        country: { type: String, default: null },
        city: { type: String, default: null },
        region: { type: String, default: null }
    },

    // Download Status
    success: {
        type: Boolean,
        required: true,
        default: true
    },
    errorMessage: {
        type: String,
        default: null
    },
    errorCode: {
        type: String,
        default: null
    },

    // Download Type
    downloadType: {
        type: String,
        enum: ['direct', 'share_link', 'api'],
        default: 'direct'
    },

    // File Info Snapshot (in case file is deleted)
    fileSnapshot: {
        originalName: { type: String },
        size: { type: Number },
        mimeType: { type: String }
    },

    // Timing
    downloadedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    duration: {
        type: Number, // Download duration in milliseconds
        default: null
    }
}, {
    timestamps: false // We use downloadedAt instead
});

// Indexes for reporting
downloadLogSchema.index({ downloadedAt: -1 });
downloadLogSchema.index({ fileId: 1, downloadedAt: -1 });
downloadLogSchema.index({ downloadedBy: 1, downloadedAt: -1 });
downloadLogSchema.index({ shareLinkId: 1, downloadedAt: -1 });
downloadLogSchema.index({ success: 1, downloadedAt: -1 });
downloadLogSchema.index({ ipAddress: 1, downloadedAt: -1 });

// Static: Log a download
downloadLogSchema.statics.logDownload = async function (data) {
    const log = new this({
        fileId: data.fileId,
        shareLinkId: data.shareLinkId || null,
        downloadedBy: data.downloadedBy || null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent || '',
        referer: data.referer || '',
        location: data.location || {},
        success: data.success !== false,
        errorMessage: data.errorMessage || null,
        errorCode: data.errorCode || null,
        downloadType: data.downloadType || 'direct',
        fileSnapshot: data.fileSnapshot || {},
        duration: data.duration || null
    });

    return log.save();
};

// Static: Get download history for a file
downloadLogSchema.statics.getFileHistory = function (fileId, options = {}) {
    const query = { fileId };
    if (options.successOnly) query.success = true;

    const limit = options.limit || 100;
    const skip = options.skip || 0;

    return this.find(query)
        .populate('downloadedBy', 'username displayName email')
        .populate('shareLinkId', 'token accessType')
        .sort({ downloadedAt: -1 })
        .skip(skip)
        .limit(limit);
};

// Static: Get download history for a user
downloadLogSchema.statics.getUserHistory = function (userId, options = {}) {
    const query = { downloadedBy: userId };
    if (options.successOnly) query.success = true;

    const limit = options.limit || 100;
    const skip = options.skip || 0;

    return this.find(query)
        .populate('fileId', 'originalName size mimeType')
        .sort({ downloadedAt: -1 })
        .skip(skip)
        .limit(limit);
};

// Static: Get statistics
downloadLogSchema.statics.getStats = async function (options = {}) {
    const match = {};

    if (options.fileId) match.fileId = new mongoose.Types.ObjectId(options.fileId);
    if (options.userId) match.downloadedBy = new mongoose.Types.ObjectId(options.userId);
    if (options.shareLinkId) match.shareLinkId = new mongoose.Types.ObjectId(options.shareLinkId);
    if (options.successOnly) match.success = true;

    if (options.startDate || options.endDate) {
        match.downloadedAt = {};
        if (options.startDate) match.downloadedAt.$gte = new Date(options.startDate);
        if (options.endDate) match.downloadedAt.$lte = new Date(options.endDate);
    }

    const stats = await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                totalDownloads: { $sum: 1 },
                successfulDownloads: {
                    $sum: { $cond: ['$success', 1, 0] }
                },
                failedDownloads: {
                    $sum: { $cond: ['$success', 0, 1] }
                },
                uniqueIPs: { $addToSet: '$ipAddress' },
                avgDuration: { $avg: '$duration' }
            }
        },
        {
            $project: {
                _id: 0,
                totalDownloads: 1,
                successfulDownloads: 1,
                failedDownloads: 1,
                uniqueIPCount: { $size: '$uniqueIPs' },
                avgDuration: { $round: ['$avgDuration', 2] },
                successRate: {
                    $round: [
                        { $multiply: [{ $divide: ['$successfulDownloads', '$totalDownloads'] }, 100] },
                        2
                    ]
                }
            }
        }
    ]);

    return stats[0] || {
        totalDownloads: 0,
        successfulDownloads: 0,
        failedDownloads: 0,
        uniqueIPCount: 0,
        avgDuration: 0,
        successRate: 0
    };
};

// Static: Get daily download counts
downloadLogSchema.statics.getDailyStats = async function (days = 30, options = {}) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const match = { downloadedAt: { $gte: startDate } };
    if (options.fileId) match.fileId = new mongoose.Types.ObjectId(options.fileId);
    if (options.userId) match.downloadedBy = new mongoose.Types.ObjectId(options.userId);
    if (options.successOnly) match.success = true;

    return this.aggregate([
        { $match: match },
        {
            $group: {
                _id: {
                    year: { $year: '$downloadedAt' },
                    month: { $month: '$downloadedAt' },
                    day: { $dayOfMonth: '$downloadedAt' }
                },
                count: { $sum: 1 },
                successCount: { $sum: { $cond: ['$success', 1, 0] } }
            }
        },
        {
            $project: {
                _id: 0,
                date: {
                    $dateFromParts: {
                        year: '$_id.year',
                        month: '$_id.month',
                        day: '$_id.day'
                    }
                },
                count: 1,
                successCount: 1
            }
        },
        { $sort: { date: 1 } }
    ]);
};

// Static: Get top downloaded files
downloadLogSchema.statics.getTopFiles = async function (limit = 10, options = {}) {
    const match = { success: true };

    if (options.startDate || options.endDate) {
        match.downloadedAt = {};
        if (options.startDate) match.downloadedAt.$gte = new Date(options.startDate);
        if (options.endDate) match.downloadedAt.$lte = new Date(options.endDate);
    }

    return this.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$fileId',
                downloadCount: { $sum: 1 },
                uniqueDownloaders: { $addToSet: '$downloadedBy' },
                lastDownload: { $max: '$downloadedAt' }
            }
        },
        {
            $lookup: {
                from: 'files',
                localField: '_id',
                foreignField: '_id',
                as: 'file'
            }
        },
        { $unwind: '$file' },
        {
            $project: {
                _id: 1,
                downloadCount: 1,
                uniqueDownloaderCount: { $size: '$uniqueDownloaders' },
                lastDownload: 1,
                originalName: '$file.originalName',
                size: '$file.size',
                mimeType: '$file.mimeType'
            }
        },
        { $sort: { downloadCount: -1 } },
        { $limit: limit }
    ]);
};

// Static: Get downloads by country
downloadLogSchema.statics.getDownloadsByCountry = async function (options = {}) {
    const match = { 'location.country': { $ne: null } };
    if (options.fileId) match.fileId = new mongoose.Types.ObjectId(options.fileId);

    return this.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$location.country',
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                country: '$_id',
                count: 1
            }
        },
        { $sort: { count: -1 } }
    ]);
};

module.exports = mongoose.model('DownloadLog', downloadLogSchema);
