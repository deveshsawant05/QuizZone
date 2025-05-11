const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Passport JWT Strategy Configuration
 * @param {Object} passport - Passport instance
 */
module.exports = (passport) => {
  const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
  };

  passport.use(new JwtStrategy(options, async (jwt_payload, done) => {
    try {
      // Find the user by id from the JWT payload
      const user = await User.findById(jwt_payload.id).select('-password');
      
      if (user) {
        return done(null, user);
      }
      
      return done(null, false);
    } catch (error) {
      logger.error(`Error in JWT strategy: ${error.message}`);
      return done(error, false);
    }
  }));
}; 