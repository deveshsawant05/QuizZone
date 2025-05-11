const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const QuizAttempt = require('../models/QuizAttempt');
const ErrorResponse = require('../utils/errorResponse');
const logger = require('../utils/logger');

/**
 * Create a new quiz
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route POST /api/quizzes
 * @access Private
 */
exports.createQuiz = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.creator = req.user.id;
    
    // Create quiz
    const quiz = await Quiz.create(req.body);
    
    logger.info(`Quiz created: ${quiz._id} by user: ${req.user.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: { quiz }
    });
    
  } catch (error) {
    logger.error(`Error creating quiz: ${error.message}`);
    next(error);
  }
};

/**
 * Get all quizzes created by current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route GET /api/quizzes
 * @access Private
 */
exports.getQuizzes = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Create query object
    const queryObj = { creator: req.user.id };
    
    // Filtering
    if (req.query.type) {
      queryObj.type = req.query.type;
    }
    
    if (typeof req.query.isPublished !== 'undefined') {
      queryObj.isPublished = req.query.isPublished === 'true';
    }
    
    // Search by title or description
    if (req.query.search) {
      queryObj.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Execute query
    const total = await Quiz.countDocuments(queryObj);
    
    const quizzes = await Quiz.find(queryObj)
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
      count: quizzes.length,
      pagination,
      data: { quizzes }
    });
    
  } catch (error) {
    logger.error(`Error fetching quizzes: ${error.message}`);
    next(error);
  }
};

/**
 * Get all published quizzes (for discovery)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route GET /api/quizzes/published
 * @access Public
 */
exports.getPublishedQuizzes = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Create query object - only published quizzes
    const queryObj = { isPublished: true };
    
    // Filtering
    if (req.query.type) {
      queryObj.type = req.query.type;
    }
    
    // Search by title, description, or tags
    if (req.query.search) {
      queryObj.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }
    
    // Execute query
    const total = await Quiz.countDocuments(queryObj);
    
    const quizzes = await Quiz.find(queryObj)
      .populate({
        path: 'creator',
        select: 'name profilePicture'
      })
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
      count: quizzes.length,
      pagination,
      data: { quizzes }
    });
    
  } catch (error) {
    logger.error(`Error fetching published quizzes: ${error.message}`);
    next(error);
  }
};

/**
 * Get a single quiz
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route GET /api/quizzes/:id
 * @access Private/Public (based on quiz status)
 */
exports.getQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate({
        path: 'creator',
        select: 'name profilePicture'
      });
    
    if (!quiz) {
      return next(new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404));
    }
    
    // Check if quiz is published or user is the creator
    const isCreator = req.user && quiz.creator.id === req.user.id;
    
    if (!quiz.isPublished && !isCreator) {
      return next(new ErrorResponse('Not authorized to access this quiz', 403));
    }
    
    res.status(200).json({
      success: true,
      data: { quiz }
    });
    
  } catch (error) {
    logger.error(`Error fetching quiz: ${error.message}`);
    next(error);
  }
};

/**
 * Get a quiz with its questions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route GET /api/quizzes/:id/full
 * @access Private/Public (based on quiz status)
 */
exports.getFullQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate({
        path: 'creator',
        select: 'name'
      });
    
    if (!quiz) {
      return next(new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404));
    }
    
    // Check if quiz is published or user is the creator
    const isCreator = req.user && quiz.creator.id === req.user.id;
    
    if (!quiz.isPublished && !isCreator) {
      return next(new ErrorResponse('Not authorized to access this quiz', 403));
    }
    
    // Find questions for this quiz
    let questions = await Question.find({ quizId: quiz._id }).sort('order');
    
    // If not creator and quiz is for participants, hide correct answers
    if (!isCreator && !quiz.settings.showCorrectAnswers) {
      questions = questions.map(question => {
        const formattedQuestion = question.toObject();
        
        // Hide which options are correct
        if (formattedQuestion.options) {
          formattedQuestion.options = formattedQuestion.options.map(option => ({
            _id: option._id,
            text: option.text
          }));
        }
        
        // Hide explanation if not showing explanations
        if (!quiz.settings.showExplanations) {
          formattedQuestion.explanation = undefined;
        }
        
        return formattedQuestion;
      });
    }
    
    // Randomize questions if setting is enabled
    if (quiz.settings.randomizeQuestions && !isCreator) {
      questions = shuffleArray(questions);
    }
    
    res.status(200).json({
      success: true,
      data: {
        quiz,
        questions
      }
    });
    
  } catch (error) {
    logger.error(`Error fetching full quiz: ${error.message}`);
    next(error);
  }
};

/**
 * Update a quiz
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route PUT /api/quizzes/:id
 * @access Private
 */
exports.updateQuiz = async (req, res, next) => {
  try {
    let quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return next(new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404));
    }
    
    // Make sure user is quiz creator
    if (quiz.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to update this quiz', 403));
    }
    
    // Update quiz
    quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    logger.info(`Quiz updated: ${quiz._id} by user: ${req.user.id}`);
    
    res.status(200).json({
      success: true,
      data: { quiz }
    });
    
  } catch (error) {
    logger.error(`Error updating quiz: ${error.message}`);
    next(error);
  }
};

/**
 * Delete a quiz
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route DELETE /api/quizzes/:id
 * @access Private
 */
exports.deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return next(new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404));
    }
    
    // Make sure user is quiz creator
    if (quiz.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to delete this quiz', 403));
    }
    
    // Delete all related questions
    await Question.deleteMany({ quizId: quiz._id });
    
    // Delete all related attempts
    await QuizAttempt.deleteMany({ quiz: quiz._id });
    
    // Delete the quiz
    await quiz.remove();
    
    logger.info(`Quiz deleted: ${req.params.id} by user: ${req.user.id}`);
    
    res.status(200).json({
      success: true,
      data: {}
    });
    
  } catch (error) {
    logger.error(`Error deleting quiz: ${error.message}`);
    next(error);
  }
};

/**
 * Publish a quiz
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route PUT /api/quizzes/:id/publish
 * @access Private
 */
exports.publishQuiz = async (req, res, next) => {
  try {
    let quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return next(new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404));
    }
    
    // Make sure user is quiz creator
    if (quiz.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to publish this quiz', 403));
    }
    
    // Check if quiz has questions
    const questionCount = await Question.countDocuments({ quizId: quiz._id });
    
    if (questionCount === 0) {
      return next(new ErrorResponse('Cannot publish quiz with no questions', 400));
    }
    
    // Update quiz published status
    quiz.isPublished = true;
    
    // Generate share code if it doesn't exist
    if (!quiz.shareCode) {
      quiz.generateShareCode();
    }
    
    await quiz.save();
    
    logger.info(`Quiz published: ${quiz._id} by user: ${req.user.id}`);
    
    res.status(200).json({
      success: true,
      data: { quiz }
    });
    
  } catch (error) {
    logger.error(`Error publishing quiz: ${error.message}`);
    next(error);
  }
};

/**
 * Unpublish a quiz
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route PUT /api/quizzes/:id/unpublish
 * @access Private
 */
exports.unpublishQuiz = async (req, res, next) => {
  try {
    let quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return next(new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404));
    }
    
    // Make sure user is quiz creator
    if (quiz.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to unpublish this quiz', 403));
    }
    
    // Update quiz published status
    quiz.isPublished = false;
    await quiz.save();
    
    logger.info(`Quiz unpublished: ${quiz._id} by user: ${req.user.id}`);
    
    res.status(200).json({
      success: true,
      data: { quiz }
    });
    
  } catch (error) {
    logger.error(`Error unpublishing quiz: ${error.message}`);
    next(error);
  }
};

/**
 * Get quiz by share code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route GET /api/quizzes/code/:shareCode
 * @access Public
 */
exports.getQuizByShareCode = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ 
      shareCode: req.params.shareCode,
      isPublished: true
    }).populate({
      path: 'creator',
      select: 'name profilePicture'
    });
    
    if (!quiz) {
      return next(new ErrorResponse('Invalid or expired share code', 404));
    }
    
    res.status(200).json({
      success: true,
      data: { quiz }
    });
    
  } catch (error) {
    logger.error(`Error fetching quiz by share code: ${error.message}`);
    next(error);
  }
};

/**
 * Get quiz statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route GET /api/quizzes/:id/stats
 * @access Private
 */
exports.getQuizStats = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return next(new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404));
    }
    
    // Make sure user is quiz creator
    if (quiz.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to view stats for this quiz', 403));
    }
    
    // Get quiz attempts
    const attempts = await QuizAttempt.find({ 
      quiz: quiz._id,
      completed: true
    }).populate({
      path: 'user',
      select: 'name'
    });
    
    // Get questions
    const questions = await Question.find({ quizId: quiz._id });
    
    // Calculate statistics
    const totalAttempts = attempts.length;
    let totalScore = 0;
    let totalPassed = 0;
    
    attempts.forEach(attempt => {
      totalScore += attempt.percentageScore;
      if (attempt.passed) totalPassed++;
    });
    
    const averageScore = totalAttempts > 0 ? totalScore / totalAttempts : 0;
    const passRate = totalAttempts > 0 ? (totalPassed / totalAttempts) * 100 : 0;
    
    // Question statistics
    const questionStats = questions.map(question => {
      let correctCount = 0;
      let attemptCount = 0;
      
      attempts.forEach(attempt => {
        const answer = attempt.answers.find(a => a.questionId.toString() === question._id.toString());
        
        if (answer) {
          attemptCount++;
          if (answer.isCorrect) correctCount++;
        }
      });
      
      return {
        questionId: question._id,
        questionText: question.questionText,
        correctCount,
        attemptCount,
        correctRate: attemptCount > 0 ? (correctCount / attemptCount) * 100 : 0
      };
    });
    
    const stats = {
      totalAttempts,
      averageScore,
      passRate,
      questionStats,
      recentAttempts: attempts
        .sort((a, b) => b.completedAt - a.completedAt)
        .slice(0, 10)
        .map(attempt => ({
          id: attempt._id,
          user: attempt.user ? attempt.user.name : 'Anonymous',
          score: attempt.percentageScore,
          passed: attempt.passed,
          completedAt: attempt.completedAt
        }))
    };
    
    res.status(200).json({
      success: true,
      data: { stats }
    });
    
  } catch (error) {
    logger.error(`Error fetching quiz stats: ${error.message}`);
    next(error);
  }
};

/**
 * Start a quiz attempt
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route POST /api/quizzes/:id/attempt
 * @access Private
 */
exports.startQuizAttempt = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return next(new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404));
    }
    
    // Check if quiz is published
    if (!quiz.isPublished) {
      return next(new ErrorResponse('Cannot attempt an unpublished quiz', 400));
    }
    
    // Create attempt
    const attempt = await QuizAttempt.create({
      quiz: quiz._id,
      user: req.user.id,
      startedAt: new Date()
    });
    
    logger.info(`Quiz attempt started: ${attempt._id} by user: ${req.user.id}`);
    
    res.status(201).json({
      success: true,
      data: { attempt }
    });
    
  } catch (error) {
    logger.error(`Error starting quiz attempt: ${error.message}`);
    next(error);
  }
};

/**
 * Submit an answer for a quiz attempt
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route POST /api/quizzes/attempt/:attemptId/answer
 * @access Private
 */
exports.submitQuizAnswer = async (req, res, next) => {
  try {
    const { questionId, selectedOptionId, timeTaken } = req.body;
    
    // Validate input
    if (!questionId || !selectedOptionId) {
      return next(new ErrorResponse('Please provide questionId and selectedOptionId', 400));
    }
    
    // Find attempt
    const attempt = await QuizAttempt.findById(req.params.attemptId);
    
    if (!attempt) {
      return next(new ErrorResponse('Quiz attempt not found', 404));
    }
    
    // Make sure attempt belongs to user
    if (attempt.user.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to submit answer for this attempt', 403));
    }
    
    // Check if attempt is still in progress
    if (attempt.completed) {
      return next(new ErrorResponse('Cannot submit answer for a completed quiz attempt', 400));
    }
    
    // Check if already answered
    const existingAnswer = attempt.answers.find(a => a.questionId.toString() === questionId);
    if (existingAnswer) {
      return next(new ErrorResponse('You have already answered this question', 400));
    }
    
    // Get the question
    const question = await Question.findById(questionId);
    
    if (!question) {
      return next(new ErrorResponse('Question not found', 404));
    }
    
    // Verify the question belongs to the quiz being attempted
    if (question.quizId.toString() !== attempt.quiz.toString()) {
      return next(new ErrorResponse('Question does not belong to this quiz', 400));
    }
    
    // Find selected option
    const selectedOption = question.options.id(selectedOptionId);
    
    if (!selectedOption) {
      return next(new ErrorResponse('Selected option not found', 404));
    }
    
    // Add answer to attempt
    attempt.answers.push({
      questionId,
      selectedOptionId,
      timeTaken: timeTaken || 0,
      isCorrect: selectedOption.isCorrect,
      points: selectedOption.isCorrect ? question.points : 0
    });
    
    await attempt.save();
    
    logger.debug(`Answer submitted for attempt: ${attempt._id}, Question: ${questionId}`);
    
    res.status(200).json({
      success: true,
      data: {
        isCorrect: selectedOption.isCorrect,
        points: selectedOption.isCorrect ? question.points : 0,
        explanation: question.explanation,
        correctOptionIds: question.options
          .filter(o => o.isCorrect)
          .map(o => o._id)
      }
    });
    
  } catch (error) {
    logger.error(`Error submitting quiz answer: ${error.message}`);
    next(error);
  }
};

/**
 * Complete a quiz attempt
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route PUT /api/quizzes/attempt/:attemptId/complete
 * @access Private
 */
exports.completeQuizAttempt = async (req, res, next) => {
  try {
    // Find attempt
    const attempt = await QuizAttempt.findById(req.params.attemptId);
    
    if (!attempt) {
      return next(new ErrorResponse('Quiz attempt not found', 404));
    }
    
    // Make sure attempt belongs to user
    if (attempt.user.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to complete this attempt', 403));
    }
    
    // Check if attempt is already completed
    if (attempt.completed) {
      return next(new ErrorResponse('This quiz attempt is already completed', 400));
    }
    
    // Mark as completed
    attempt.completed = true;
    attempt.completedAt = new Date();
    
    await attempt.save();
    
    // Populate quiz details for the result
    await attempt.populate({
      path: 'quiz',
      select: 'title description settings'
    });
    
    // Populate question details for the result
    const questions = await Question.find({
      _id: { $in: attempt.answers.map(a => a.questionId) }
    });
    
    // Combine answers with question details
    const answersWithDetails = attempt.answers.map(answer => {
      const question = questions.find(q => q._id.toString() === answer.questionId.toString());
      
      return {
        ...answer.toObject(),
        questionText: question ? question.questionText : 'Unknown Question',
        correctOptions: question ? question.options.filter(o => o.isCorrect).map(o => o._id) : [],
        explanation: question ? question.explanation : ''
      };
    });
    
    logger.info(`Quiz attempt completed: ${attempt._id} by user: ${req.user.id}`);
    
    res.status(200).json({
      success: true,
      data: {
        attempt: {
          ...attempt.toObject(),
          answers: answersWithDetails
        }
      }
    });
    
  } catch (error) {
    logger.error(`Error completing quiz attempt: ${error.message}`);
    next(error);
  }
};

/**
 * Get user's quiz attempts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route GET /api/quizzes/attempts
 * @access Private
 */
exports.getUserAttempts = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Find user's attempts
    const total = await QuizAttempt.countDocuments({ user: req.user.id });
    
    const attempts = await QuizAttempt.find({ user: req.user.id })
      .populate({
        path: 'quiz',
        select: 'title description coverImage creator',
        populate: {
          path: 'creator',
          select: 'name'
        }
      })
      .skip(startIndex)
      .limit(limit)
      .sort({ startedAt: -1 });
    
    // Pagination result
    const pagination = {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
    
    res.status(200).json({
      success: true,
      count: attempts.length,
      pagination,
      data: { attempts }
    });
    
  } catch (error) {
    logger.error(`Error fetching user attempts: ${error.message}`);
    next(error);
  }
};

/**
 * Helper function to shuffle array (Fisher-Yates algorithm)
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Get quiz results for a specific attempt
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route GET /api/quizzes/:quizId/results/:attemptId
 * @access Private
 */
exports.getQuizResults = async (req, res, next) => {
  try {
    const { quizId, attemptId } = req.params;
    
    // Find the attempt
    const attempt = await QuizAttempt.findById(attemptId)
      .populate({
        path: 'quiz',
        select: 'title description coverImage settings'
      })
      .populate({
        path: 'user',
        select: 'name profilePicture'
      })
      .populate({
        path: 'answers.questionId',
        model: 'Question',
        select: 'questionText questionType options explanation points'
      });
    
    if (!attempt) {
      return next(new ErrorResponse(`Attempt not found with id of ${attemptId}`, 404));
    }
    
    // Verify quiz ID matches
    if (attempt.quiz._id.toString() !== quizId) {
      return next(new ErrorResponse('Quiz ID does not match attempt', 400));
    }
    
    // Check user owns this attempt or is quiz creator
    const isAttemptOwner = req.user.id === attempt.user._id.toString();
    const isQuizOwner = req.user.id === attempt.quiz.creator?.toString();
    
    if (!isAttemptOwner && !isQuizOwner) {
      return next(new ErrorResponse('Not authorized to access these results', 403));
    }
    
    // Format the results
    const result = {
      attemptId: attempt._id,
      user: {
        _id: attempt.user._id,
        name: attempt.user.name
      },
      quiz: {
        _id: attempt.quiz._id,
        title: attempt.quiz.title
      },
      totalScore: attempt.score,
      maxPossibleScore: attempt.maxScore,
      percentageScore: attempt.percentageScore,
      passed: attempt.passed,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      timeTaken: getTimeTaken(attempt.startedAt, attempt.completedAt),
      answers: attempt.answers.map(answer => {
        const question = answer.questionId;
        
        return {
          questionId: question._id,
          questionText: question.questionText,
          questionType: question.questionType,
          isCorrect: answer.isCorrect,
          points: answer.points,
          timeTaken: answer.timeTaken,
          correctOption: question.options.find(opt => opt.isCorrect) || null,
          selectedOption: question.options.find(
            opt => opt._id.toString() === answer.selectedOptionId?.toString()
          ) || null,
          allOptions: isQuizOwner || attempt.quiz.settings.showCorrectAnswers 
            ? question.options 
            : question.options.map(opt => ({
                _id: opt._id,
                text: opt.text
              })),
          explanation: isQuizOwner || attempt.quiz.settings.showExplanations 
            ? question.explanation 
            : null
        };
      })
    };
    
    res.status(200).json({
      success: true,
      data: { result }
    });
    
  } catch (error) {
    logger.error(`Error fetching quiz results: ${error.message}`);
    next(error);
  }
};

// Helper function to calculate time taken
const getTimeTaken = (startTime, endTime) => {
  if (!startTime || !endTime) return null;
  
  const diff = Math.abs(new Date(endTime) - new Date(startTime)) / 1000; // in seconds
  
  const minutes = Math.floor(diff / 60);
  const seconds = Math.floor(diff % 60);
  
  return `${minutes}m ${seconds}s`;
}; 