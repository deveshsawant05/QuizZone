const jwt = require('jsonwebtoken');
const logger = require('./logger');

/**
 * Generate an access token
 * @param {Object} user - User object with _id
 * @returns {string} - JWT token
 */
exports.generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

/**
 * Generate a refresh token
 * @param {Object} user - User object with _id
 * @returns {string} - JWT token
 */
exports.generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE }
  );
};

/**
 * Verify a refresh token
 * @param {string} token - Refresh token
 * @returns {Object|null} - Decoded token or null if invalid
 */
exports.verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    logger.error(`Error verifying refresh token: ${error.message}`);
    return null;
  }
}; 