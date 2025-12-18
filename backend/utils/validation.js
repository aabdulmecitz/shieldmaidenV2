const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation Middleware
 * Input validation schemas using express-validator
 */

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

/**
 * User Registration Validation
 */
exports.validateRegistration = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),

    body('email')
        .trim()
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),

    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),

    body('displayName')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Display name must not exceed 50 characters'),

    handleValidationErrors
];

/**
 * User Login Validation
 */
exports.validateLogin = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    handleValidationErrors
];

/**
 * File Upload Validation
 */
exports.validateFileUpload = [
    body('expiresIn')
        .optional()
        .isInt({ min: 1, max: 8760 }) // Max 1 year in hours
        .withMessage('Expiration must be between 1 and 8760 hours'),

    body('downloadLimit')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Download limit must be between 1 and 1000'),

    body('accessType')
        .optional()
        .isIn(['single', 'multiple', 'unlimited'])
        .withMessage('Access type must be single, multiple, or unlimited'),

    body('password')
        .optional()
        .isLength({ min: 4 })
        .withMessage('Password must be at least 4 characters'),

    handleValidationErrors
];

/**
 * Share Link Creation Validation
 */
exports.validateShareLinkCreation = [
    body('accessType')
        .optional()
        .isIn(['single', 'multiple', 'unlimited'])
        .withMessage('Access type must be single, multiple, or unlimited'),

    body('downloadLimit')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Download limit must be between 1 and 1000'),

    body('expiresIn')
        .optional()
        .isInt({ min: 1, max: 8760 })
        .withMessage('Expiration must be between 1 and 8760 hours'),

    body('password')
        .optional()
        .isLength({ min: 4 })
        .withMessage('Password must be at least 4 characters'),

    body('customMessage')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Custom message must not exceed 500 characters'),

    body('allowedIPs')
        .optional()
        .isArray()
        .withMessage('Allowed IPs must be an array'),

    body('allowedEmails')
        .optional()
        .isArray()
        .withMessage('Allowed emails must be an array'),

    body('requiresAuth')
        .optional()
        .isBoolean()
        .withMessage('Requires auth must be a boolean'),

    body('notifyOnDownload')
        .optional()
        .isBoolean()
        .withMessage('Notify on download must be a boolean'),

    handleValidationErrors
];

/**
 * Share Link Update Validation
 */
exports.validateShareLinkUpdate = [
    body('downloadLimit')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Download limit must be between 1 and 1000'),

    body('expiresAt')
        .optional()
        .isISO8601()
        .withMessage('Expiration date must be a valid ISO 8601 date'),

    body('customMessage')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Custom message must not exceed 500 characters'),

    handleValidationErrors
];

/**
 * MongoDB ObjectId Validation
 */
exports.validateObjectId = (paramName = 'id') => [
    param(paramName)
        .isMongoId()
        .withMessage('Invalid ID format'),

    handleValidationErrors
];

/**
 * Pagination Validation
 */
exports.validatePagination = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    query('skip')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Skip must be a non-negative integer'),

    handleValidationErrors
];

/**
 * Date Range Validation
 */
exports.validateDateRange = [
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid ISO 8601 date'),

    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid ISO 8601 date'),

    handleValidationErrors
];

module.exports = exports;
