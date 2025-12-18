const AnalyticsService = require('../services/AnalyticsService');
const { createSuccessResponse, createErrorResponse } = require('../utils/responseHelper');

/**
 * DashboardController
 * Provides dashboard data for frontend
 */

/**
 * Get user dashboard data
 * GET /api/dashboard/user
 * @access Private
 */
exports.getUserDashboard = async (req, res) => {
    try {
        const stats = await AnalyticsService.getUserStats(req.user._id);
        const activity = await AnalyticsService.getUserActivity(req.user._id, 30);

        res.status(200).json(createSuccessResponse('Dashboard data retrieved', {
            ...stats,
            activity
        }));

    } catch (error) {
        console.error('Get User Dashboard Error:', error);
        res.status(500).json(createErrorResponse('Error', error.message));
    }
};

/**
 * Get admin dashboard data
 * GET /api/dashboard/admin
 * @access Admin
 */
exports.getAdminDashboard = async (req, res) => {
    try {
        const systemStats = await AnalyticsService.getSystemStats();
        const topFiles = await AnalyticsService.getTopFiles(10);

        res.status(200).json(createSuccessResponse('Admin dashboard data retrieved', {
            system: systemStats,
            topFiles
        }));

    } catch (error) {
        console.error('Get Admin Dashboard Error:', error);
        res.status(500).json(createErrorResponse('Error', error.message));
    }
};

/**
 * Get metrics for charts
 * GET /api/dashboard/metrics
 * @access Private
 */
exports.getMetrics = async (req, res) => {
    try {
        const { days = 30, userId, fileId } = req.query;

        // Non-admin users can only see their own metrics
        const targetUserId = req.user.role === 'admin' ? userId : req.user._id;

        const metrics = await AnalyticsService.getDailyMetrics(parseInt(days), {
            userId: targetUserId,
            fileId
        });

        res.status(200).json(createSuccessResponse('Metrics retrieved', metrics));

    } catch (error) {
        console.error('Get Metrics Error:', error);
        res.status(500).json(createErrorResponse('Error', error.message));
    }
};

/**
 * Get download history
 * GET /api/dashboard/downloads
 * @access Private
 */
exports.getDownloadHistory = async (req, res) => {
    try {
        const {
            limit = 50,
            skip = 0,
            userId,
            fileId,
            shareLinkId,
            startDate,
            endDate,
            successOnly
        } = req.query;

        // Non-admin users can only see their own downloads
        const targetUserId = req.user.role === 'admin' ? userId : req.user._id;

        const history = await AnalyticsService.getDownloadHistory(
            {
                userId: targetUserId,
                fileId,
                shareLinkId,
                startDate,
                endDate,
                successOnly: successOnly === 'true'
            },
            {
                limit: parseInt(limit),
                skip: parseInt(skip)
            }
        );

        res.status(200).json(createSuccessResponse('Download history retrieved', history));

    } catch (error) {
        console.error('Get Download History Error:', error);
        res.status(500).json(createErrorResponse('Error', error.message));
    }
};

/**
 * Get download distribution by country
 * GET /api/dashboard/geo
 * @access Admin
 */
exports.getGeoDistribution = async (req, res) => {
    try {
        const { fileId } = req.query;

        const distribution = await AnalyticsService.getDownloadsByCountry({ fileId });

        res.status(200).json(createSuccessResponse('Geo distribution retrieved', {
            distribution
        }));

    } catch (error) {
        console.error('Get Geo Distribution Error:', error);
        res.status(500).json(createErrorResponse('Error', error.message));
    }
};

module.exports = exports;
