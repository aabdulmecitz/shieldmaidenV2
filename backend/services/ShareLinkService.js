const ShareLink = require('../models/ShareLink');
const File = require('../models/File');
const bcrypt = require('bcryptjs');

/**
 * ShareLinkService
 * Business logic for share link operations
 * Follows Single Responsibility Principle
 */
class ShareLinkService {
    /**
     * Create a share link for a file
     * @param {String} fileId - File ID
     * @param {String} userId - Creator user ID
     * @param {Object} options - Share link options
     * @returns {Promise<Object>} Created share link
     */
    async createShareLink(fileId, userId, options = {}) {
        const {
            accessType = 'multiple',
            downloadLimit = 10,
            expiresIn = 24, // hours
            password = null,
            allowedIPs = [],
            allowedEmails = [],
            requiresAuth = false,
            customMessage = '',
            notifyOnDownload = false,
            notificationEmail = null
        } = options;

        // Verify file exists and user owns it
        const file = await File.findById(fileId);
        if (!file) {
            throw new Error('File not found');
        }

        if (file.owner.toString() !== userId.toString()) {
            throw new Error('Access denied: You do not own this file');
        }

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + expiresIn);

        // Hash password if provided
        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Create share link
        const shareLink = await ShareLink.create({
            fileId,
            createdBy: userId,
            accessType,
            downloadLimit: accessType === 'unlimited' ? 999999 : downloadLimit,
            expiresAt,
            password: hashedPassword,
            allowedIPs,
            allowedEmails,
            requiresAuth,
            customMessage,
            notifyOnDownload,
            notificationEmail: notificationEmail || null
        });

        return shareLink;
    }

    /**
     * Validate share link and check access permissions
     * @param {String} token - Share link token
     * @param {Object} context - Request context (IP, user, password)
     * @returns {Promise<Object>} Share link with file data
     */
    async validateShareLink(token, context = {}) {
        const { ipAddress, userId, password } = context;

        // Find share link
        const shareLink = await ShareLink.findByToken(token);

        if (!shareLink) {
            throw new Error('Share link not found or inactive');
        }

        // Check if expired
        if (shareLink.isExpired) {
            await shareLink.deactivate('expired');
            throw new Error('Share link has expired');
        }

        // Check if limit reached
        if (shareLink.isLimitReached) {
            await shareLink.deactivate('limit_reached');
            throw new Error('Download limit reached');
        }

        // Check password protection
        if (shareLink.isPasswordProtected) {
            if (!password) {
                throw new Error('Password required');
            }
            const isValidPassword = await shareLink.checkPassword(password);
            if (!isValidPassword) {
                throw new Error('Invalid password');
            }
        }

        // Check IP whitelist
        if (shareLink.allowedIPs && shareLink.allowedIPs.length > 0) {
            if (!ipAddress || !shareLink.allowedIPs.includes(ipAddress)) {
                throw new Error('Access denied: IP not whitelisted');
            }
        }

        // Check authentication requirement
        if (shareLink.requiresAuth && !userId) {
            throw new Error('Authentication required');
        }

        // Check email whitelist
        if (shareLink.allowedEmails && shareLink.allowedEmails.length > 0) {
            if (!userId) {
                throw new Error('Authentication required for email verification');
            }
            // Would need to populate user here to check email
            const User = require('../models/User');
            const user = await User.findById(userId);
            if (!user || !shareLink.allowedEmails.includes(user.email)) {
                throw new Error('Access denied: Email not whitelisted');
            }
        }

        return shareLink;
    }

    /**
     * Record a download and update statistics
     * @param {String} shareLinkId - Share link ID
     * @param {String} ipAddress - Downloader IP
     * @returns {Promise<Object>} Updated share link
     */
    async recordDownload(shareLinkId, ipAddress = null) {
        const shareLink = await ShareLink.findById(shareLinkId);
        if (!shareLink) {
            throw new Error('Share link not found');
        }

        await shareLink.recordAccess(ipAddress);
        return shareLink;
    }

    /**
     * Get share links for a file
     * @param {String} fileId - File ID
     * @param {String} userId - User ID (for ownership check)
     * @returns {Promise<Array>} Array of share links
     */
    async getFileShareLinks(fileId, userId) {
        // Verify ownership
        const file = await File.findById(fileId);
        if (!file) {
            throw new Error('File not found');
        }

        if (file.owner.toString() !== userId.toString()) {
            throw new Error('Access denied');
        }

        return ShareLink.findByFile(fileId);
    }

    /**
     * Get user's share links
     * @param {String} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Array of share links
     */
    async getUserShareLinks(userId, options = {}) {
        const { activeOnly = false } = options;
        return ShareLink.findByUser(userId, { activeOnly });
    }

    /**
     * Update share link settings
     * @param {String} shareLinkId - Share link ID
     * @param {String} userId - User ID (for ownership check)
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated share link
     */
    async updateShareLink(shareLinkId, userId, updates) {
        const shareLink = await ShareLink.findById(shareLinkId).populate('fileId');

        if (!shareLink) {
            throw new Error('Share link not found');
        }

        // Check ownership
        if (shareLink.createdBy.toString() !== userId.toString()) {
            throw new Error('Access denied');
        }

        // Allowed updates
        const allowedFields = [
            'downloadLimit',
            'expiresAt',
            'customMessage',
            'notifyOnDownload',
            'notificationEmail'
        ];

        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                shareLink[field] = updates[field];
            }
        });

        // Handle password update separately
        if (updates.password !== undefined) {
            if (updates.password) {
                shareLink.password = await bcrypt.hash(updates.password, 10);
            } else {
                shareLink.password = null;
            }
        }

        await shareLink.save();
        return shareLink;
    }

    /**
     * Deactivate a share link
     * @param {String} shareLinkId - Share link ID
     * @param {String} userId - User ID (for ownership check)
     * @param {String} reason - Deactivation reason
     * @returns {Promise<Object>} Deactivated share link
     */
    async deactivateShareLink(shareLinkId, userId, reason = 'manual') {
        const shareLink = await ShareLink.findById(shareLinkId);

        if (!shareLink) {
            throw new Error('Share link not found');
        }

        // Check ownership
        if (shareLink.createdBy.toString() !== userId.toString()) {
            throw new Error('Access denied');
        }

        await shareLink.deactivate(reason);
        return shareLink;
    }

    /**
     * Get share link statistics
     * @param {String} userId - User ID (null for global stats)
     * @returns {Promise<Object>} Statistics
     */
    async getShareLinkStats(userId = null) {
        return ShareLink.getStats(userId);
    }

    /**
     * Cleanup expired share links
     * @returns {Promise<Number>} Number of links deactivated
     */
    async cleanupExpiredLinks() {
        const expiredLinks = await ShareLink.findExpiredLinks();

        for (const link of expiredLinks) {
            await link.deactivate('expired');
        }

        return expiredLinks.length;
    }
}

module.exports = new ShareLinkService();
