const FileService = require('../services/FileService');
const ShareLinkService = require('../services/ShareLinkService');
const DownloadLog = require('../models/DownloadLog');
const { decryptFileStream } = require('../utils/encryption');
const { createSuccessResponse, createErrorResponse } = require('../utils/responseHelper');
const fs = require('fs');

/**
 * FileController
 * Handles file-related HTTP requests
 * Delegates business logic to services
 */

/**
 * Upload a file
 * POST /api/files/upload
 * @access Private
 */
exports.uploadFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).json(createErrorResponse('Upload failed', 'No file uploaded'));
    }

    try {
        const { expiresIn, downloadLimit, password, accessType } = req.body;

        // Upload and encrypt file
        const file = await FileService.uploadFile(req.file, req.user._id);

        // Create default share link
        const shareLink = await ShareLinkService.createShareLink(
            file._id,
            req.user._id,
            {
                accessType: accessType || 'multiple',
                downloadLimit: parseInt(downloadLimit) || 10,
                expiresIn: parseInt(expiresIn) || 24, // hours
                password: password || null
            }
        );

        res.status(201).json(createSuccessResponse('File uploaded successfully', {
            file: {
                id: file._id,
                name: file.originalName,
                size: file.size,
                sizeFormatted: file.sizeFormatted,
                mimetype: file.mimetype,
                uploadedAt: file.createdAt
            },
            shareLink: {
                id: shareLink._id,
                token: shareLink.token,
                url: shareLink.shareUrl,
                expiresAt: shareLink.expiresAt,
                downloadLimit: shareLink.downloadLimit,
                accessType: shareLink.accessType
            }
        }));

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json(createErrorResponse('Upload failed', error.message));
    }
};

/**
 * Get user's files
 * GET /api/files/my-files
 * @access Private
 */
exports.getMyFiles = async (req, res) => {
    try {
        const { limit, skip, sort } = req.query;

        const files = await FileService.getUserFiles(req.user._id, {
            limit: parseInt(limit) || 50,
            skip: parseInt(skip) || 0,
            sort: sort ? JSON.parse(sort) : { createdAt: -1 }
        });

        // Get share link count for each file
        const filesWithLinks = await Promise.all(
            files.map(async (file) => {
                const shareLinks = await ShareLinkService.getFileShareLinks(file._id, req.user._id);
                return {
                    ...file.toObject(),
                    shareLinkCount: shareLinks.length,
                    activeShareLinks: shareLinks.filter(link => link.isActive).length
                };
            })
        );

        res.status(200).json(createSuccessResponse('Files retrieved', {
            files: filesWithLinks,
            count: filesWithLinks.length
        }));

    } catch (error) {
        console.error('Get Files Error:', error);
        res.status(500).json(createErrorResponse('Error retrieving files', error.message));
    }
};

/**
 * Get file details
 * GET /api/files/:id
 * @access Private
 */
exports.getFileDetails = async (req, res) => {
    try {
        const file = await FileService.getFileById(req.params.id, req.user._id);
        const shareLinks = await ShareLinkService.getFileShareLinks(file._id, req.user._id);

        res.status(200).json(createSuccessResponse('File details retrieved', {
            file: file.toObject(),
            shareLinks
        }));

    } catch (error) {
        console.error('Get File Details Error:', error);
        const statusCode = error.message === 'File not found' ? 404 :
            error.message === 'Access denied' ? 403 : 500;
        res.status(statusCode).json(createErrorResponse('Error', error.message));
    }
};

/**
 * Create share link for existing file
 * POST /api/files/:fileId/share
 * @access Private
 */
exports.createShareLink = async (req, res) => {
    try {
        const { fileId } = req.params;
        const options = req.body;

        const shareLink = await ShareLinkService.createShareLink(
            fileId,
            req.user._id,
            options
        );

        res.status(201).json(createSuccessResponse('Share link created', {
            shareLink: {
                id: shareLink._id,
                token: shareLink.token,
                url: shareLink.shareUrl,
                expiresAt: shareLink.expiresAt,
                downloadLimit: shareLink.downloadLimit,
                accessType: shareLink.accessType,
                isPasswordProtected: shareLink.isPasswordProtected
            }
        }));

    } catch (error) {
        console.error('Create Share Link Error:', error);
        const statusCode = error.message.includes('not found') ? 404 :
            error.message.includes('Access denied') ? 403 : 500;
        res.status(statusCode).json(createErrorResponse('Error creating share link', error.message));
    }
};

/**
 * Get share links for a file
 * GET /api/files/:fileId/shares
 * @access Private
 */
exports.getFileShareLinks = async (req, res) => {
    try {
        const { fileId } = req.params;
        const shareLinks = await ShareLinkService.getFileShareLinks(fileId, req.user._id);

        res.status(200).json(createSuccessResponse('Share links retrieved', {
            shareLinks,
            count: shareLinks.length
        }));

    } catch (error) {
        console.error('Get Share Links Error:', error);
        const statusCode = error.message.includes('not found') ? 404 :
            error.message.includes('Access denied') ? 403 : 500;
        res.status(statusCode).json(createErrorResponse('Error', error.message));
    }
};

/**
 * Delete file
 * DELETE /api/files/:id
 * @access Private (Owner or Admin)
 */
exports.deleteFile = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';
        await FileService.deleteFile(req.params.id, req.user._id, isAdmin);

        res.status(200).json(createSuccessResponse('File deleted successfully', null));

    } catch (error) {
        console.error('Delete File Error:', error);
        const statusCode = error.message === 'File not found' ? 404 :
            error.message === 'Access denied' ? 403 : 500;
        res.status(statusCode).json(createErrorResponse('Delete failed', error.message));
    }
};

/**
 * Download file via share link
 * GET /api/files/download/:token
 * @access Public
 */
exports.downloadFile = async (req, res) => {
    const { token } = req.params;
    const { password } = req.query;
    const startTime = Date.now();

    try {
        // Validate share link
        const shareLink = await ShareLinkService.validateShareLink(token, {
            ipAddress: req.ip,
            userId: req.user?._id,
            password
        });

        // Get file with encryption keys
        const File = require('../models/File');
        const file = await File.findById(shareLink.fileId)
            .select('+encryption.key +encryption.iv');

        if (!file) {
            throw new Error('File not found');
        }

        // Verify physical file exists
        if (!fs.existsSync(file.path)) {
            throw new Error('File missing from storage');
        }

        // Record download
        await ShareLinkService.recordDownload(shareLink._id, req.ip);

        // Log download
        await DownloadLog.logDownload({
            fileId: file._id,
            shareLinkId: shareLink._id,
            downloadedBy: req.user?._id || null,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            referer: req.get('referer'),
            success: true,
            downloadType: 'share_link',
            fileSnapshot: {
                originalName: file.originalName,
                size: file.size,
                mimeType: file.mimetype
            }
        });

        // Set headers
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.setHeader('Content-Type', file.mimetype);

        // Decrypt and stream
        await decryptFileStream(file.path, res, file.encryption.key, file.encryption.iv);

        // Log duration
        const duration = Date.now() - startTime;
        console.log(`File downloaded: ${file.originalName} in ${duration}ms`);

    } catch (error) {
        console.error('Download Error:', error);

        // Log failed download
        try {
            await DownloadLog.logDownload({
                fileId: null,
                shareLinkId: null,
                downloadedBy: req.user?._id || null,
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                success: false,
                errorMessage: error.message,
                downloadType: 'share_link'
            });
        } catch (logError) {
            console.error('Error logging failed download:', logError);
        }

        if (!res.headersSent) {
            const statusCode = error.message.includes('not found') ? 404 :
                error.message.includes('expired') ? 410 :
                    error.message.includes('limit reached') ? 410 :
                        error.message.includes('Password required') ? 401 :
                            error.message.includes('Invalid password') ? 401 :
                                error.message.includes('Access denied') ? 403 : 500;

            res.status(statusCode).json(createErrorResponse('Download failed', error.message));
        }
    }
};

/**
 * Get file info via share token (metadata only)
 * GET /api/files/info/:token
 * @access Public
 */
exports.getFileInfo = async (req, res) => {
    const { token } = req.params;

    try {
        const shareLink = await ShareLinkService.validateShareLink(token, {
            ipAddress: req.ip,
            userId: req.user?._id
        });

        const File = require('../models/File');
        const file = await File.findById(shareLink.fileId);

        if (!file) {
            return res.status(404).json(createErrorResponse('Not Found', 'File not found'));
        }

        res.status(200).json(createSuccessResponse('File info retrieved', {
            file: {
                name: file.originalName,
                size: file.size,
                sizeFormatted: file.sizeFormatted,
                mimetype: file.mimetype
            },
            shareLink: {
                expiresAt: shareLink.expiresAt,
                expiresIn: shareLink.expiresIn,
                downloadLimit: shareLink.downloadLimit,
                downloadCount: shareLink.downloadCount,
                remainingDownloads: shareLink.remainingDownloads,
                isPasswordProtected: shareLink.isPasswordProtected,
                customMessage: shareLink.customMessage
            }
        }));

    } catch (error) {
        console.error('Get File Info Error:', error);
        const statusCode = error.message.includes('not found') ? 404 :
            error.message.includes('expired') ? 410 : 500;
        res.status(statusCode).json(createErrorResponse('Error', error.message));
    }
};

module.exports = exports;
