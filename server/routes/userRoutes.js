const express = require('express');
const { 
  getProfile, 
  updateProfile, 
  changePassword, 
  getDashboardStats, 
  deleteAccount,
  getUserAttempts,
  getUserStatistics
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.get('/dashboard', getDashboardStats);
router.delete('/account', deleteAccount);

// User quiz attempts and statistics
router.get('/me/attempts', getUserAttempts);
router.get('/me/statistics', getUserStatistics);

module.exports = router; 