const express = require('express');
const {
  createLiveQuiz,
  getLiveQuizzes,
  getLiveQuiz,
  getLiveQuizByCode,
  updateLiveQuizSettings,
  endLiveQuiz,
  getLiveQuizResults
} = require('../controllers/liveQuizController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/code/:sessionCode', getLiveQuizByCode);

// Protected routes - Authentication required
router.use(protect);

router.route('/')
  .get(getLiveQuizzes)
  .post(createLiveQuiz);

router.route('/:id')
  .get(getLiveQuiz);

router.put('/:id/settings', updateLiveQuizSettings);
router.put('/:id/end', endLiveQuiz);
router.get('/:id/results', getLiveQuizResults);

module.exports = router; 