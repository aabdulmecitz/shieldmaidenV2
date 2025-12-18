const User = require('../models/User');
const FileService = require('../services/FileService');
const DownloadLog = require('../models/DownloadLog');
const ShareLink = require('../models/ShareLink');
const { createSuccessResponse, createErrorResponse } = require('../utils/responseHelper');

/**
 * AdminController
 * Admin-only operations
 */

/**
 * Get all users
 * GET /api/admin/users
 * @access Admin
 */
exports.getAllUsers = async (req, res) => {
    try {
        const {
            limit = 50,
            skip = 0,
            role,
            isActive,
            search
        } = req.query;

        const query = {};
        if (role) query.role = role;
        if (isActive !== undefined) query.isActive = isActive === 'true';
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { displayName: { $regex: search, $options: 'i' } }
            ];
        }

        const [users, total] = await Promise.all([
            User.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(parseInt(skip))
                .limit(parseInt(limit)),
            User.countDocuments(query)
        ]);

        res.status(200).json(createSuccessResponse('Users retrieved', {
            users,
            total,
            page: Math.floor(parseInt(skip) / parseInt(limit)) + 1,
            limit: parseInt(limit)
        }));

    } catch (error) {
        console.error('Get All Users Error:', error);
        res.status(500).json(createErrorResponse('Error', error.message));
    }
};

/**
 * Get all files
 * GET /api/admin/files
 * @access Admin
 */
exports.getAllFiles = async (req, res) => {
    try {
        const {
            limit = 50,
            skip = 0,
            owner,
            search
        } = req.query;

        const filters = {};
        if (owner) filters.owner = owner;
        if (search) {
            filters.originalName = { $regex: search, $options: 'i' };
        }

        const result = await FileService.getAllFiles(filters, {
            limit: parseInt(limit),
            skip: parseInt(skip)
        });

        res.status(200).json(createSuccessResponse('Files retrieved', result));

    } catch (error) {
        console.error('Get All Files Error:', error);
        res.status(500).json(createErrorResponse('Error', error.message));
    }
};

/**
 * Delete user and all their files
 * DELETE /api/admin/users/:id
 * @access Admin
 */
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent self-deletion
        if (id === req.user._id.toString()) {
            return res.status(400).json(createErrorResponse('Error', 'Cannot delete your own account'));
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json(createErrorResponse('Not Found', 'User not found'));
        }

        // Delete all user's files
        const File = require('../models/File');
        const userFiles = await File.find({ owner: id });

        for (const file of userFiles) {
            await FileService.deleteFile(file._id, id, true);
        }

        // Delete user
        await User.findByIdAndDelete(id);

        res.status(200).json(createSuccessResponse('User deleted successfully', null));

    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json(createErrorResponse('Delete failed', error.message));
    }
};

/**
 * Get audit logs
 * GET /api/admin/audit
 * @access Admin
 */
exports.getAuditLogs = async (req, res) => {
    try {
        const {
            limit = 100,
            skip = 0,
            userId,
            fileId,
            startDate,
            endDate,
            success
        } = req.query;

        const query = {};
        if (userId) query.downloadedBy = userId;
        if (fileId) query.fileId = fileId;
        if (success !== undefined) query.success = success === 'true';

        if (startDate || endDate) {
            query.downloadedAt = {};
            if (startDate) query.downloadedAt.$gte = new Date(startDate);
            if (endDate) query.downloadedAt.$lte = new Date(endDate);
        }

        const [logs, total] = await Promise.all([
            DownloadLog.find(query)
                .populate('fileId', 'originalName size')
                .populate('downloadedBy', 'username email')
                .populate('shareLinkId', 'token accessType')
                .sort({ downloadedAt: -1 })
                .skip(parseInt(skip))
                .limit(parseInt(limit)),
            DownloadLog.countDocuments(query)
        ]);

        res.status(200).json(createSuccessResponse('Audit logs retrieved', {
            logs,
            total,
            page: Math.floor(parseInt(skip) / parseInt(limit)) + 1,
            limit: parseInt(limit)
        }));

    } catch (error) {
        console.error('Get Audit Logs Error:', error);
        res.status(500).json(createErrorResponse('Error', error.message));
    }
};

/**
 * Get system health
 * GET /api/admin/health
 * @access Admin
 */
exports.getSystemHealth = async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const fs = require('fs');
        const path = require('path');

        // Database status
        const dbStatus = mongoose.connection.readyState;
        const dbStates = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };

        // Disk usage
        const uploadsDir = path.join(__dirname, '../uploads/encrypted');
        let diskUsage = 0;
        let fileCount = 0;

        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            fileCount = files.length;
            files.forEach(file => {
                const stats = fs.statSync(path.join(uploadsDir, file));
                diskUsage += stats.size;
            });
        }

        // Memory usage
        const memUsage = process.memoryUsage();

        res.status(200).json(createSuccessResponse('System health retrieved', {
            database: {
                status: dbStates[dbStatus] || 'unknown',
                connected: dbStatus === 1
            },
            storage: {
                diskUsage,
                diskUsageFormatted: formatBytes(diskUsage),
                fileCount
            },
            memory: {
                rss: formatBytes(memUsage.rss),
                heapTotal: formatBytes(memUsage.heapTotal),
                heapUsed: formatBytes(memUsage.heapUsed),
                external: formatBytes(memUsage.external)
            },
            uptime: process.uptime(),
            nodeVersion: process.version
        }));

    } catch (error) {
        console.error('Get System Health Error:', error);
        res.status(500).json(createErrorResponse('Error', error.message));
    }
};

/**
 * Update user role
 * PUT /api/admin/users/:id/role
 * @access Admin
 */
exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json(createErrorResponse('Error', 'Invalid role'));
        }

        // Prevent self-demotion
        if (id === req.user._id.toString() && role !== 'admin') {
            return res.status(400).json(createErrorResponse('Error', 'Cannot change your own role'));
        }

        const user = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json(createErrorResponse('Not Found', 'User not found'));
        }

        res.status(200).json(createSuccessResponse('User role updated', { user }));

    } catch (error) {
        console.error('Update User Role Error:', error);
        res.status(500).json(createErrorResponse('Update failed', error.message));
    }
};

/**
 * Toggle user active status
 * PUT /api/admin/users/:id/status
 * @access Admin
 */
exports.toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent self-deactivation
        if (id === req.user._id.toString()) {
            return res.status(400).json(createErrorResponse('Error', 'Cannot deactivate your own account'));
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json(createErrorResponse('Not Found', 'User not found'));
        }

        user.isActive = !user.isActive;
        await user.save();

        res.status(200).json(createSuccessResponse('User status updated', {
            user: {
                id: user._id,
                username: user.username,
                isActive: user.isActive
            }
        }));

    } catch (error) {
        console.error('Toggle User Status Error:', error);
        res.status(500).json(createErrorResponse('Update failed', error.message));
    }
};

// Helper function
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

module.exports = exports;
