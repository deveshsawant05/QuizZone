const express = require('express');
const {
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  saveToQuestionBank,
  getQuestionBank,
  addToQuiz
} = require('../controllers/questionController');
const { protect } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(protect);

// Routes for questions within a quiz
router.route('/')
  .get(getQuestions)
  .post(createQuestion);

router.put('/reorder', reorderQuestions);

// Routes for question bank
router.get('/bank', getQuestionBank);
router.post('/bank/:id/add-to-quiz/:quizId', addToQuiz);

// Routes for individual questions
router.route('/:id')
  .get(getQuestion)
  .put(updateQuestion)
  .delete(deleteQuestion);

router.post('/:id/save', saveToQuestionBank);

module.exports = router; 