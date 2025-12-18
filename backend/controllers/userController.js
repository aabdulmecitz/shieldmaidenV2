const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { createSuccessResponse, createErrorResponse } = require('../utils/responseHelper');

/**
 * User Controller
 * Handles user authentication and profile operations
 */

/**
 * Register new user
 * POST /api/users/register
 */
const register = async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Input validation
    if (!username || !email || !password) {
      return res.status(400).json(createErrorResponse('Validation error', 'Username, email, and password are required'));
    }

    if (password.length < 6) {
      return res.status(400).json(createErrorResponse('Validation error', 'Password must be at least 6 characters long'));
    }

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json(createErrorResponse('User already exists', 'Email or username is already taken'));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      displayName: displayName || username
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'dev-secret-change-in-production',
      { expiresIn: '7d' }
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(createSuccessResponse('User registered successfully', { user: userResponse, token }));

  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json(createErrorResponse('Error registering user', error.message));
  }
};

/**
 * Login user
 * POST /api/users/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(createErrorResponse('Validation error', 'Email and password are required'));
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json(createErrorResponse('Invalid credentials', 'Email or password is incorrect'));
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json(createErrorResponse('Invalid credentials', 'Email or password is incorrect'));
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'dev-secret-change-in-production',
      { expiresIn: '7d' }
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(createSuccessResponse('Login successful', { user: userResponse, token }));

  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json(createErrorResponse('Error logging in', error.message));
  }
};

/**
 * Get user profile
 * GET /api/users/profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json(createErrorResponse('User not found', 'User does not exist'));
    }
    res.json(createSuccessResponse('Profile retrieved successfully', { user }));
  } catch (error) {
    res.status(500).json(createErrorResponse('Error retrieving profile', error.message));
  }
};

/**
 * Update user profile
 * PUT /api/users/profile
 */
const updateProfile = async (req, res) => {
  try {
    const updates = req.body;

    // Prevent sensitive updates
    delete updates.email;
    delete updates.password;
    delete updates.role; // Prevent self-promotion
    delete updates.storageLimit;

    const user = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(createSuccessResponse('Profile updated successfully', user));
  } catch (error) {
    res.status(500).json(createErrorResponse('Error updating profile', error.message));
  }
};

/**
 * Update encryption keys (RSA Public Key)
 * PUT /api/users/encryption-keys
 */
const updateEncryptionKeys = async (req, res) => {
  try {
    const { publicKey } = req.body;

    if (!publicKey) {
      return res.status(400).json(createErrorResponse('Invalid request', 'Public key is required'));
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        'encryption.publicKey': publicKey,
        'encryption.lastKeyUpdate': new Date(),
      },
      { new: true }
    ).select('-password');

    res.json(createSuccessResponse('Encryption keys updated successfully', user));
  } catch (error) {
    res.status(500).json(createErrorResponse('Error updating encryption keys', error.message));
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  updateEncryptionKeys
};
