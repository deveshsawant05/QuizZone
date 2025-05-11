const Question = require('../models/Question');
const Quiz = require('../models/Quiz');
const QuestionBank = require('../models/QuestionBank');
const ErrorResponse = require('../utils/errorResponse');
const logger = require('../utils/logger');

/**
 * Create a new question for a quiz
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route POST /api/quizzes/:quizId/questions
 * @access Private
 */
exports.createQuestion = async (req, res, next) => {
  try {
    // Add quizId to req.body
    req.body.quizId = req.params.quizId;
    
    // Check if quiz exists and belongs to user
    const quiz = await Quiz.findById(req.params.quizId);
    
    if (!quiz) {
      return next(new ErrorResponse(`Quiz not found with id of ${req.params.quizId}`, 404));
    }
    
    // Make sure user is quiz creator
    if (quiz.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to add questions to this quiz', 403));
    }
    
    // Default order value (add to end of list)
    if (!req.body.order) {
      const lastQuestion = await Question.findOne({ quizId: req.params.quizId })
        .sort('-order');
      
      req.body.order = lastQuestion ? lastQuestion.order + 1 : 1;
    }
    
    // Create question
    const question = await Question.create(req.body);
    
    logger.info(`Question created: ${question._id} for quiz: ${req.params.quizId}`);
    
    res.status(201).json({
      success: true,
      data: { question }
    });
    
  } catch (error) {
    logger.error(`Error creating question: ${error.message}`);
    next(error);
  }
};

/**
 * Get all questions for a quiz
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route GET /api/quizzes/:quizId/questions
 * @access Private
 */
exports.getQuestions = async (req, res, next) => {
  try {
    // Check if quiz exists and belongs to user
    const quiz = await Quiz.findById(req.params.quizId);
    
    if (!quiz) {
      return next(new ErrorResponse(`Quiz not found with id of ${req.params.quizId}`, 404));
    }
    
    // Check if user is authorized to view questions
    const isAuthorized = quiz.creator.toString() === req.user.id || 
                          req.user.role === 'admin' || 
                          quiz.isPublished;
    
    if (!isAuthorized) {
      return next(new ErrorResponse('Not authorized to view questions for this quiz', 403));
    }
    
    const questions = await Question.find({ quizId: req.params.quizId }).sort('order');
    
    res.status(200).json({
      success: true,
      count: questions.length,
      data: { questions }
    });
    
  } catch (error) {
    logger.error(`Error fetching questions: ${error.message}`);
    next(error);
  }
};

/**
 * Get a single question
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route GET /api/questions/:id
 * @access Private
 */
exports.getQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return next(new ErrorResponse(`Question not found with id of ${req.params.id}`, 404));
    }
    
    // Check if user is authorized to view the question
    const quiz = await Quiz.findById(question.quizId);
    
    if (!quiz) {
      return next(new ErrorResponse('Associated quiz not found', 404));
    }
    
    const isAuthorized = quiz.creator.toString() === req.user.id || 
                          req.user.role === 'admin' || 
                          quiz.isPublished;
    
    if (!isAuthorized) {
      return next(new ErrorResponse('Not authorized to view this question', 403));
    }
    
    res.status(200).json({
      success: true,
      data: { question }
    });
    
  } catch (error) {
    logger.error(`Error fetching question: ${error.message}`);
    next(error);
  }
};

/**
 * Update a question
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route PUT /api/questions/:id
 * @access Private
 */
exports.updateQuestion = async (req, res, next) => {
  try {
    let question = await Question.findById(req.params.id);
    
    if (!question) {
      return next(new ErrorResponse(`Question not found with id of ${req.params.id}`, 404));
    }
    
    // Check if user is authorized to update the question
    const quiz = await Quiz.findById(question.quizId);
    
    if (!quiz) {
      return next(new ErrorResponse('Associated quiz not found', 404));
    }
    
    if (quiz.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to update this question', 403));
    }
    
    // Update question
    question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    logger.info(`Question updated: ${question._id}`);
    
    res.status(200).json({
      success: true,
      data: { question }
    });
    
  } catch (error) {
    logger.error(`Error updating question: ${error.message}`);
    next(error);
  }
};

/**
 * Delete a question
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route DELETE /api/questions/:id
 * @access Private
 */
exports.deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return next(new ErrorResponse(`Question not found with id of ${req.params.id}`, 404));
    }
    
    // Check if user is authorized to delete the question
    const quiz = await Quiz.findById(question.quizId);
    
    if (!quiz) {
      return next(new ErrorResponse('Associated quiz not found', 404));
    }
    
    if (quiz.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to delete this question', 403));
    }
    
    // Use findByIdAndDelete instead of remove()
    await Question.findByIdAndDelete(req.params.id);
    
    // Update order of remaining questions
    const remainingQuestions = await Question.find({ 
      quizId: question.quizId,
      order: { $gt: question.order }
    });
    
    for (const q of remainingQuestions) {
      q.order = q.order - 1;
      await q.save();
    }
    
    logger.info(`Question deleted: ${req.params.id}`);
    
    res.status(200).json({
      success: true,
      data: {}
    });
    
  } catch (error) {
    logger.error(`Error deleting question: ${error.message}`);
    next(error);
  }
};

/**
 * Update question order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route PUT /api/quizzes/:quizId/questions/reorder
 * @access Private
 */
exports.reorderQuestions = async (req, res, next) => {
  try {
    const { questions } = req.body;
    
    if (!questions || !Array.isArray(questions)) {
      return next(new ErrorResponse('Please provide an array of questions with id and order', 400));
    }
    
    // Check if quiz exists and belongs to user
    const quiz = await Quiz.findById(req.params.quizId);
    
    if (!quiz) {
      return next(new ErrorResponse(`Quiz not found with id of ${req.params.quizId}`, 404));
    }
    
    if (quiz.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to reorder questions for this quiz', 403));
    }
    
    // Update order for each question
    const updatePromises = questions.map(question => 
      Question.findOneAndUpdate(
        { _id: question.id, quizId: req.params.quizId },
        { order: question.order },
        { new: true }
      )
    );
    
    await Promise.all(updatePromises);
    
    logger.info(`Questions reordered for quiz: ${req.params.quizId}`);
    
    // Get updated questions list
    const updatedQuestions = await Question.find({ quizId: req.params.quizId }).sort('order');
    
    res.status(200).json({
      success: true,
      data: { questions: updatedQuestions }
    });
    
  } catch (error) {
    logger.error(`Error reordering questions: ${error.message}`);
    next(error);
  }
};

/**
 * Add question to user's question bank
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route POST /api/questions/:id/save
 * @access Private
 */
exports.saveToQuestionBank = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return next(new ErrorResponse(`Question not found with id of ${req.params.id}`, 404));
    }
    
    // Check if user can access this question
    const quiz = await Quiz.findById(question.quizId);
    
    if (!quiz) {
      return next(new ErrorResponse('Associated quiz not found', 404));
    }
    
    const canAccess = quiz.creator.toString() === req.user.id || 
                       req.user.role === 'admin' || 
                       quiz.isPublished;
    
    if (!canAccess) {
      return next(new ErrorResponse('Not authorized to save this question', 403));
    }
    
    // Create question bank entry
    const bankQuestion = await QuestionBank.create({
      user: req.user.id,
      questionText: question.questionText,
      questionType: question.questionType,
      image: question.image,
      options: question.options,
      explanation: question.explanation,
      tags: question.tags,
      difficulty: question.difficulty
    });
    
    logger.info(`Question saved to bank: ${bankQuestion._id} by user: ${req.user.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Question saved to your question bank',
      data: { question: bankQuestion }
    });
    
  } catch (error) {
    logger.error(`Error saving to question bank: ${error.message}`);
    next(error);
  }
};

/**
 * Get questions from user's question bank
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route GET /api/questionbank
 * @access Private
 */
exports.getQuestionBank = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Build query
    const queryObj = { user: req.user.id };
    
    // Filter by type
    if (req.query.type) {
      queryObj.questionType = req.query.type;
    }
    
    // Filter by difficulty
    if (req.query.difficulty) {
      queryObj.difficulty = req.query.difficulty;
    }
    
    // Search by text or tags
    if (req.query.search) {
      queryObj.$or = [
        { questionText: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }
    
    // Execute query
    const total = await QuestionBank.countDocuments(queryObj);
    
    const questions = await QuestionBank.find(queryObj)
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Pagination result
    const pagination = {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
    
    res.status(200).json({
      success: true,
      count: questions.length,
      pagination,
      data: { questions }
    });
    
  } catch (error) {
    logger.error(`Error fetching question bank: ${error.message}`);
    next(error);
  }
};

/**
 * Add question from question bank to a quiz
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route POST /api/questionbank/:id/add-to-quiz/:quizId
 * @access Private
 */
exports.addToQuiz = async (req, res, next) => {
  try {
    const bankQuestion = await QuestionBank.findById(req.params.id);
    
    if (!bankQuestion) {
      return next(new ErrorResponse(`Question not found in bank with id of ${req.params.id}`, 404));
    }
    
    // Make sure question belongs to user
    if (bankQuestion.user.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to use this question', 403));
    }
    
    // Check if quiz exists and belongs to user
    const quiz = await Quiz.findById(req.params.quizId);
    
    if (!quiz) {
      return next(new ErrorResponse(`Quiz not found with id of ${req.params.quizId}`, 404));
    }
    
    if (quiz.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to add questions to this quiz', 403));
    }
    
    // Default order value (add to end of list)
    const lastQuestion = await Question.findOne({ quizId: req.params.quizId })
      .sort('-order');
    
    const order = lastQuestion ? lastQuestion.order + 1 : 1;
    
    // Create question in quiz
    const question = await Question.create({
      quizId: req.params.quizId,
      questionText: bankQuestion.questionText,
      questionType: bankQuestion.questionType,
      image: bankQuestion.image,
      options: bankQuestion.options,
      explanation: bankQuestion.explanation,
      points: req.body.points || 10,
      timeLimit: req.body.timeLimit,
      order,
      tags: bankQuestion.tags,
      difficulty: bankQuestion.difficulty
    });
    
    // Update usage count
    bankQuestion.usageCount += 1;
    await bankQuestion.save();
    
    logger.info(`Bank question added to quiz: ${question._id} to quiz: ${req.params.quizId}`);
    
    res.status(201).json({
      success: true,
      message: 'Question added to quiz successfully',
      data: { question }
    });
    
  } catch (error) {
    logger.error(`Error adding bank question to quiz: ${error.message}`);
    next(error);
  }
}; 