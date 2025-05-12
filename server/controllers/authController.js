const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenUtils');
const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return next(new ErrorResponse('Email already in use', 400));
    }
    
    // Create user
    const user = await User.create({
      name,
      email,
      password
    });
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Add refresh token to user's tokens array
    user.refreshTokens = [refreshToken];
    await user.save();
    
    logger.info(`New user registered: ${user._id}`);
    
    // Send tokens in response
    sendTokenResponse(user, 201, res, accessToken, refreshToken);
    
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    next(error);
  }
};

/**
 * Login user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide an email and password', 400));
    }
    
    // Check for user and include the password field which is by default not selected
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }
    
    // Check if password matches
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Add refresh token to user's tokens array
    user.refreshTokens.push(refreshToken);
    
    // Limit the number of refresh tokens (optional)
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    
    await user.save();
    
    logger.info(`User logged in: ${user._id}`);
    
    // Send tokens in response
    sendTokenResponse(user, 200, res, accessToken, refreshToken);
    
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    next(error);
  }
};

/**
 * Logout user / clear cookies
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route POST /api/auth/logout
 * @access Private
 */
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    // Find user by id
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Remove refresh token from database
    if (refreshToken) {
      user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
      await user.save();
    }
    
    logger.info(`User logged out: ${user._id}`);
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    next(error);
  }
};

/**
 * Refresh access token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route POST /api/auth/refresh-token
 * @access Public
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return next(new ErrorResponse('Refresh token is required', 400));
    }
    
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    if (!decoded) {
      return next(new ErrorResponse('Invalid refresh token', 401));
    }
    
    // Check if user exists and token is in their tokens array
    const user = await User.findOne({ 
      _id: decoded.id,
      refreshTokens: refreshToken
    });
    
    if (!user) {
      return next(new ErrorResponse('Invalid refresh token', 401));
    }
    
    // Generate new access token
    const accessToken = generateAccessToken(user);
    
    logger.info(`Access token refreshed for user: ${user._id}`);
    
    res.status(200).json({
      success: true,
      accessToken
    });
    
  } catch (error) {
    logger.error(`Refresh token error: ${error.message}`);
    next(error);
  }
};

/**
 * Get current logged in user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route GET /api/auth/me
 * @access Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error(`Get current user error: ${error.message}`);
    next(error);
  }
};

/**
 * Request password reset email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route POST /api/auth/forgot-password
 * @access Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return next(new ErrorResponse('Please provide an email address', 400));
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      // We still return a 200 for security reasons (don't reveal if email exists)
      return res.status(200).json({
        success: true,
        message: 'Password reset link sent to your email'
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Set reset token and expiry
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save();
    
    // Send email with token (email sending logic would go here)
    // const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    logger.info(`Password reset requested for: ${user._id}`);
    
    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email'
    });
    
  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`);
    next(error);
  }
};

/**
 * Reset password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route POST /api/auth/reset-password
 * @access Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body;
    
    if (!token || !password) {
      return next(new ErrorResponse('Invalid token or password', 400));
    }
    
    if (password !== confirmPassword) {
      return next(new ErrorResponse('Passwords do not match', 400));
    }
    
    // Hash the token to compare with stored hash
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return next(new ErrorResponse('Invalid or expired token', 400));
    }
    
    // Set new password and clear reset fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    // Clear all refresh tokens to force re-login
    user.refreshTokens = [];
    
    await user.save();
    
    logger.info(`Password reset successful for: ${user._id}`);
    
    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
    
  } catch (error) {
    logger.error(`Reset password error: ${error.message}`);
    next(error);
  }
};

/**
 * Helper function to send token response
 * @param {Object} user - User object
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 */
const sendTokenResponse = (user, statusCode, res, accessToken, refreshToken) => {
  res.status(statusCode).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt
      },
      accessToken,
      refreshToken
    }
  });
}; 