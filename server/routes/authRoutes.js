const express = require('express');
const { register, login, logout, refreshToken, getMe, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Apply rate limiting to authentication routes
router.use(authLimiter);

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.use(protect);
router.post('/logout', logout);
router.get('/me', getMe);

module.exports = router; 