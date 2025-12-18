const File = require('../models/File');
const ShareLink = require('../models/ShareLink');
const DownloadLog = require('../models/DownloadLog');
const User = require('../models/User');

/**
 * AnalyticsService
 * Business logic for analytics and reporting
 * Provides dashboard metrics and statistics
 */
class AnalyticsService {
    /**
     * Get system-wide statistics (Admin)
     * @returns {Promise<Object>} System statistics
     */
    async getSystemStats() {
        const [
            totalUsers,
            totalFiles,
            totalShareLinks,
            activeShareLinks,
            downloadStats,
            storageStats
        ] = await Promise.all([
            User.countDocuments(),
            File.countDocuments({ isDeleted: { $ne: true } }),
            ShareLink.countDocuments(),
            ShareLink.countDocuments({ isActive: true }),
            DownloadLog.getStats(),
            this._getStorageStats()
        ]);

        return {
            users: {
                total: totalUsers,
                active: await User.countDocuments({ isActive: { $ne: false } })
            },
            files: {
                total: totalFiles,
                totalSize: storageStats.totalSize
            },
            shareLinks: {
                total: totalShareLinks,
                active: activeShareLinks
            },
            downloads: downloadStats,
            storage: storageStats
        };
    }

    /**
     * Get user-specific statistics
     * @param {String} userId - User ID
     * @returns {Promise<Object>} User statistics
     */
    async getUserStats(userId) {
        const [
            user,
            fileCount,
            shareLinkStats,
            downloadStats,
            recentFiles,
            recentDownloads
        ] = await Promise.all([
            User.findById(userId),
            File.countDocuments({ owner: userId, isDeleted: { $ne: true } }),
            ShareLink.getStats(userId),
            DownloadLog.getStats({ userId }),
            this._getRecentFiles(userId, 5),
            this._getRecentDownloads(userId, 10)
        ]);

        if (!user) {
            throw new Error('User not found');
        }

        return {
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                storageUsed: user.storageUsed,
                storageQuota: parseInt(process.env.STORAGE_QUOTA_PER_USER) || 1073741824,
                storagePercentage: (user.storageUsed / (parseInt(process.env.STORAGE_QUOTA_PER_USER) || 1073741824)) * 100
            },
            files: {
                total: fileCount,
                uploaded: user.stats?.totalFilesUploaded || 0
            },
            shareLinks: shareLinkStats,
            downloads: downloadStats,
            recent: {
                files: recentFiles,
                downloads: recentDownloads
            }
        };
    }

    /**
     * Get download history with pagination
     * @param {Object} filters - Query filters
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} Download logs and metadata
     */
    async getDownloadHistory(filters = {}, options = {}) {
        const {
            userId = null,
            fileId = null,
            shareLinkId = null,
            startDate = null,
            endDate = null,
            successOnly = false,
            limit = 50,
            skip = 0
        } = { ...filters, ...options };

        const query = {};
        if (userId) query.downloadedBy = userId;
        if (fileId) query.fileId = fileId;
        if (shareLinkId) query.shareLinkId = shareLinkId;
        if (successOnly) query.success = true;

        if (startDate || endDate) {
            query.downloadedAt = {};
            if (startDate) query.downloadedAt.$gte = new Date(startDate);
            if (endDate) query.downloadedAt.$lte = new Date(endDate);
        }

        const [logs, total] = await Promise.all([
            DownloadLog.find(query)
                .populate('fileId', 'originalName size mimetype')
                .populate('downloadedBy', 'username email')
                .populate('shareLinkId', 'token accessType')
                .sort({ downloadedAt: -1 })
                .skip(skip)
                .limit(limit),
            DownloadLog.countDocuments(query)
        ]);

        return {
            logs,
            total,
            page: Math.floor(skip / limit) + 1,
            limit,
            hasMore: skip + limit < total
        };
    }

    /**
     * Get daily metrics for charts
     * @param {Number} days - Number of days to retrieve
     * @param {Object} filters - Optional filters
     * @returns {Promise<Object>} Daily metrics
     */
    async getDailyMetrics(days = 30, filters = {}) {
        const { userId = null, fileId = null } = filters;

        const downloadMetrics = await DownloadLog.getDailyStats(days, {
            userId,
            fileId,
            successOnly: false
        });

        // Get file upload metrics
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const uploadMetrics = await File.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    ...(userId && { owner: userId })
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    totalSize: { $sum: '$size' }
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
                    totalSize: 1
                }
            },
            { $sort: { date: 1 } }
        ]);

        return {
            downloads: downloadMetrics,
            uploads: uploadMetrics
        };
    }

    /**
     * Get top downloaded files
     * @param {Number} limit - Number of files to return
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Top files
     */
    async getTopFiles(limit = 10, options = {}) {
        return DownloadLog.getTopFiles(limit, options);
    }

    /**
     * Get download distribution by country
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Country distribution
     */
    async getDownloadsByCountry(options = {}) {
        return DownloadLog.getDownloadsByCountry(options);
    }

    /**
     * Get recent files for a user
     * @private
     * @param {String} userId - User ID
     * @param {Number} limit - Number of files
     * @returns {Promise<Array>} Recent files
     */
    async _getRecentFiles(userId, limit = 5) {
        return File.find({ owner: userId, isDeleted: { $ne: true } })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('originalName size mimetype createdAt');
    }

    /**
     * Get recent downloads for a user
     * @private
     * @param {String} userId - User ID
     * @param {Number} limit - Number of downloads
     * @returns {Promise<Array>} Recent downloads
     */
    async _getRecentDownloads(userId, limit = 10) {
        return DownloadLog.find({ downloadedBy: userId })
            .populate('fileId', 'originalName size')
            .sort({ downloadedAt: -1 })
            .limit(limit)
            .select('fileId downloadedAt success ipAddress');
    }

    /**
     * Get storage statistics
     * @private
     * @returns {Promise<Object>} Storage stats
     */
    async _getStorageStats() {
        const stats = await File.aggregate([
            { $match: { isDeleted: { $ne: true } } },
            {
                $group: {
                    _id: null,
                    totalSize: { $sum: '$size' },
                    avgSize: { $avg: '$size' },
                    maxSize: { $max: '$size' },
                    minSize: { $min: '$size' }
                }
            }
        ]);

        return stats[0] || {
            totalSize: 0,
            avgSize: 0,
            maxSize: 0,
            minSize: 0
        };
    }

    /**
     * Get user activity summary
     * @param {String} userId - User ID
     * @param {Number} days - Number of days to analyze
     * @returns {Promise<Object>} Activity summary
     */
    async getUserActivity(userId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [uploads, downloads, shareLinksCreated] = await Promise.all([
            File.countDocuments({
                owner: userId,
                createdAt: { $gte: startDate }
            }),
            DownloadLog.countDocuments({
                downloadedBy: userId,
                downloadedAt: { $gte: startDate }
            }),
            ShareLink.countDocuments({
                createdBy: userId,
                createdAt: { $gte: startDate }
            })
        ]);

        return {
            period: `Last ${days} days`,
            uploads,
            downloads,
            shareLinksCreated
        };
    }
}

module.exports = new AnalyticsService();
