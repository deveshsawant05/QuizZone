const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Create a rate limiter middleware
 * @param {number} windowMinutes - Time window in minutes
 * @param {number} maxRequests - Maximum requests per window
 * @param {string} message - Custom message for rate limit exceeded
 * @returns {Function} - Express rate limiter middleware
 */
exports.createRateLimiter = (windowMinutes = 15, maxRequests = 100, message) => {
  // Skip rate limiting in test environment
  if (process.env.NODE_ENV === 'test') {
    return (req, res, next) => next();
  }

  return rateLimit({
    windowMs: windowMinutes * 60 * 1000, // Convert minutes to milliseconds
    max: maxRequests, // Limit each IP to maxRequests requests per windowMs
    message: message || `Too many requests, please try again after ${windowMinutes} minutes`,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res, next, options) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(options.statusCode).json({
        success: false,
        error: options.message,
      });
    },
  });
};

// Specific rate limiters for different routes
exports.authLimiter = exports.createRateLimiter(15, 10, 'Too many authentication attempts, please try again after 15 minutes');
exports.apiLimiter = exports.createRateLimiter(15, 100);
exports.quizCreationLimiter = exports.createRateLimiter(60, 20, 'Too many quiz creations, please try again after an hour'); 