const ShareLinkService = require('../services/ShareLinkService');
const { createSuccessResponse, createErrorResponse } = require('../utils/responseHelper');

/**
 * ShareLinkController
 * Handles share link management requests
 */

/**
 * Get share link details
 * GET /api/share/:token
 * @access Public
 */
exports.getShareLinkInfo = async (req, res) => {
    try {
        const { token } = req.params;

        const shareLink = await ShareLinkService.validateShareLink(token, {
            ipAddress: req.ip,
            userId: req.user?._id
        });

        res.status(200).json(createSuccessResponse('Share link info retrieved', {
            shareLink: {
                token: shareLink.token,
                accessType: shareLink.accessType,
                downloadLimit: shareLink.downloadLimit,
                downloadCount: shareLink.downloadCount,
                remainingDownloads: shareLink.remainingDownloads,
                expiresAt: shareLink.expiresAt,
                expiresIn: shareLink.expiresIn,
                isPasswordProtected: shareLink.isPasswordProtected,
                customMessage: shareLink.customMessage,
                canBeUsed: shareLink.canBeUsed
            },
            file: {
                name: shareLink.fileId.originalName,
                size: shareLink.fileId.size,
                mimetype: shareLink.fileId.mimetype
            }
        }));

    } catch (error) {
        console.error('Get Share Link Info Error:', error);
        const statusCode = error.message.includes('not found') ? 404 :
            error.message.includes('expired') ? 410 : 500;
        res.status(statusCode).json(createErrorResponse('Error', error.message));
    }
};

/**
 * Get user's share links
 * GET /api/share/my-links
 * @access Private
 */
exports.getMyShareLinks = async (req, res) => {
    try {
        const { activeOnly } = req.query;

        const shareLinks = await ShareLinkService.getUserShareLinks(req.user._id, {
            activeOnly: activeOnly === 'true'
        });

        res.status(200).json(createSuccessResponse('Share links retrieved', {
            shareLinks,
            count: shareLinks.length
        }));

    } catch (error) {
        console.error('Get My Share Links Error:', error);
        res.status(500).json(createErrorResponse('Error', error.message));
    }
};

/**
 * Update share link
 * PUT /api/share/:id
 * @access Private
 */
exports.updateShareLink = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const shareLink = await ShareLinkService.updateShareLink(id, req.user._id, updates);

        res.status(200).json(createSuccessResponse('Share link updated', {
            shareLink
        }));

    } catch (error) {
        console.error('Update Share Link Error:', error);
        const statusCode = error.message.includes('not found') ? 404 :
            error.message.includes('Access denied') ? 403 : 500;
        res.status(statusCode).json(createErrorResponse('Update failed', error.message));
    }
};

/**
 * Deactivate share link
 * DELETE /api/share/:id
 * @access Private
 */
exports.deactivateShareLink = async (req, res) => {
    try {
        const { id } = req.params;

        await ShareLinkService.deactivateShareLink(id, req.user._id, 'manual');

        res.status(200).json(createSuccessResponse('Share link deactivated', null));

    } catch (error) {
        console.error('Deactivate Share Link Error:', error);
        const statusCode = error.message.includes('not found') ? 404 :
            error.message.includes('Access denied') ? 403 : 500;
        res.status(statusCode).json(createErrorResponse('Deactivation failed', error.message));
    }
};

/**
 * Get share link statistics
 * GET /api/share/stats
 * @access Private
 */
exports.getShareLinkStats = async (req, res) => {
    try {
        const stats = await ShareLinkService.getShareLinkStats(req.user._id);

        res.status(200).json(createSuccessResponse('Statistics retrieved', stats));

    } catch (error) {
        console.error('Get Share Link Stats Error:', error);
        res.status(500).json(createErrorResponse('Error', error.message));
    }
};

module.exports = exports;
