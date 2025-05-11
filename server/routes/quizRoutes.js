const express = require('express');
const { 
  createQuiz,
  getQuizzes,
  getPublishedQuizzes,
  getQuiz,
  getFullQuiz,
  updateQuiz,
  deleteQuiz,
  publishQuiz,
  unpublishQuiz,
  getQuizByShareCode,
  getQuizStats,
  startQuizAttempt,
  submitQuizAnswer,
  completeQuizAttempt,
  getUserAttempts,
  getQuizResults
} = require('../controllers/quizController');
const { protect } = require('../middleware/auth');
const { quizCreationLimiter } = require('../middleware/rateLimit');

// Include nested routes
const questionRouter = require('./questionRoutes');

const router = express.Router();

// Re-route into other resource routers
router.use('/:quizId/questions', questionRouter);

// Public routes
router.get('/published', getPublishedQuizzes);
router.get('/shared/:shareCode', getQuizByShareCode);

// Protected routes - Authentication required
router.use(protect);

// Apply rate limiting to quiz creation
router.post('/', quizCreationLimiter, createQuiz);

// Quiz management
router.get('/', getQuizzes);
router.get('/:id', getQuiz);
router.get('/:id/full', getFullQuiz);
router.put('/:id', updateQuiz);
router.delete('/:id', deleteQuiz);
router.put('/:id/publish', publishQuiz);
router.put('/:id/unpublish', unpublishQuiz);
router.get('/:id/stats', getQuizStats);
router.get('/:quizId/results/:attemptId', getQuizResults);

// Quiz attempts
router.post('/:id/attempt', startQuizAttempt);
router.post('/attempt/:attemptId/answer', submitQuizAnswer);
router.put('/attempt/:attemptId/complete', completeQuizAttempt);
router.get('/attempts', getUserAttempts);

module.exports = router; 