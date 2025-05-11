const passport = require('passport');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Protect routes - requires user to be authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.protect = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) {
      return next(new ErrorResponse('Authentication error', 401));
    }
    
    if (!user) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }
    
    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Authorize specific roles
 * @param  {...string} roles - Roles authorized to access the route
 * @returns {Function} - Express middleware
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user.role || !roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(`User role ${req.user.role} is not authorized to access this route`, 403)
      );
    }
    next();
  };
}; 