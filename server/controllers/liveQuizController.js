const LiveQuiz = require('../models/LiveQuiz');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const ErrorResponse = require('../utils/errorResponse');
const logger = require('../utils/logger');

/**
 * Create a new live quiz session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route POST /api/live-quizzes
 * @access Private
 */
exports.createLiveQuiz = async (req, res, next) => {
  try {
    const { quizId, settings } = req.body;
    
    // Check if quiz exists
    const quiz = await Quiz.findById(quizId);
    
    if (!quiz) {
      return next(new ErrorResponse(`Quiz not found with id of ${quizId}`, 404));
    }
    
    // Make sure user is quiz creator or admin
    if (quiz.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to create a live session for this quiz', 403));
    }
    
    // Check if quiz has questions
    const questionCount = await Question.countDocuments({ quizId: quiz._id });
    
    if (questionCount === 0) {
      return next(new ErrorResponse('Cannot create a live quiz with no questions', 400));
    }
    
    // Create live quiz session
    const liveQuiz = await LiveQuiz.create({
      quiz: quizId,
      host: req.user.id,
      settings: settings || {}
    });
    
    logger.info(`Live quiz created: ${liveQuiz._id} for quiz: ${quizId} by user: ${req.user.id}`);
    
    res.status(201).json({
      success: true,
      message: 'Live quiz session created successfully',
      data: { liveQuiz }
    });
    
  } catch (error) {
    logger.error(`Error creating live quiz: ${error.message}`);
    next(error);
  }
};

/**
 * Get all live quiz sessions created by current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route GET /api/live-quizzes
 * @access Private
 */
exports.getLiveQuizzes = async (req, res, next) => {
  try {
    // Find live quiz sessions
    const liveQuizzes = await LiveQuiz.find({ host: req.user.id })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: liveQuizzes.length,
      data: { liveQuizzes }
    });
    
  } catch (error) {
    logger.error(`Error fetching live quizzes: ${error.message}`);
    next(error);
  }
};

/**
 * Get a single live quiz session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route GET /api/live-quizzes/:id
 * @access Private
 */
exports.getLiveQuiz = async (req, res, next) => {
  try {
    const liveQuiz = await LiveQuiz.findById(req.params.id);
    
    if (!liveQuiz) {
      return next(new ErrorResponse(`Resource not found`, 404));
    }
    
    // Make sure user is the host or admin
    if (liveQuiz.host._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to access this live quiz session', 403));
    }
    
    res.status(200).json({
      success: true,
      data: { liveQuiz }
    });
    
  } catch (error) {
    logger.error(`Error fetching live quiz: ${error.message}`);
    next(error);
  }
};

/**
 * Get live quiz by session code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route GET /api/live-quizzes/code/:sessionCode
 * @access Public
 */
exports.getLiveQuizByCode = async (req, res, next) => {
  try {
    logger.info(`Fetching live quiz with code: ${req.params.sessionCode}`);
    
    const liveQuiz = await LiveQuiz.findOne({ 
      sessionCode: req.params.sessionCode 
    }).populate({
      path: 'quiz',
      select: 'title description settings'
    }).populate({
      path: 'host',
      select: 'name profilePicture'
    });
    
    if (!liveQuiz) {
      logger.warn(`No live quiz found with code: ${req.params.sessionCode}`);
      return next(new ErrorResponse('Invalid or expired session code', 404));
    }
    
    // Check if the quiz is active
    if (liveQuiz.status === 'completed') {
      logger.warn(`Attempted to join completed live quiz: ${liveQuiz._id}`);
      return next(new ErrorResponse('This quiz session has ended', 400));
    }
    
    const participantCount = liveQuiz.participants.filter(p => p.isActive).length;
    
    logger.info(`Successfully retrieved live quiz with code: ${req.params.sessionCode}, participant count: ${participantCount}`);
    
    res.status(200).json({
      success: true,
      data: {
        roomId: liveQuiz._id,
        sessionCode: liveQuiz.sessionCode,
        status: liveQuiz.status,
        quiz: {
          id: liveQuiz.quiz._id,
          title: liveQuiz.quiz.title,
          description: liveQuiz.quiz.description,
          settings: liveQuiz.quiz.settings
        },
        host: {
          name: liveQuiz.host.name,
          profilePicture: liveQuiz.host.profilePicture
        },
        participantCount,
        createdAt: liveQuiz.createdAt
      }
    });
    
  } catch (error) {
    logger.error(`Error fetching live quiz by code: ${error.message}`);
    next(error);
  }
};

/**
 * Update live quiz session settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route PUT /api/live-quizzes/:id/settings
 * @access Private
 */
exports.updateLiveQuizSettings = async (req, res, next) => {
  try {
    let liveQuiz = await LiveQuiz.findById(req.params.id);
    
    if (!liveQuiz) {
      return next(new ErrorResponse(`Resource not found`, 404));
    }
    
    // Make sure user is the host or admin
    if (liveQuiz.host._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to update this live quiz session', 403));
    }
    
    // Can only update settings if quiz is in waiting state
    if (liveQuiz.status !== 'waiting') {
      return next(new ErrorResponse('Cannot update settings after quiz has started', 400));
    }
    
    // Update settings
    liveQuiz = await LiveQuiz.findByIdAndUpdate(
      req.params.id,
      { settings: req.body },
      { new: true, runValidators: true }
    );
    
    logger.info(`Live quiz settings updated: ${liveQuiz._id}`);
    
    res.status(200).json({
      success: true,
      data: { liveQuiz }
    });
    
  } catch (error) {
    logger.error(`Error updating live quiz settings: ${error.message}`);
    next(error);
  }
};

/**
 * End a live quiz session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route PUT /api/live-quizzes/:id/end
 * @access Private
 */
exports.endLiveQuiz = async (req, res, next) => {
  try {
    let liveQuiz = await LiveQuiz.findById(req.params.id);
    
    if (!liveQuiz) {
      return next(new ErrorResponse(`Resource not found`, 404));
    }
    
    // Make sure user is the host or admin
    if (liveQuiz.host._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to end this live quiz session', 403));
    }
    
    // Update status to completed
    liveQuiz = await LiveQuiz.findByIdAndUpdate(
      req.params.id,
      { status: 'completed' },
      { new: true }
    );
    
    logger.info(`Live quiz ended: ${liveQuiz._id}`);
    
    res.status(200).json({
      success: true,
      message: 'Live quiz session ended successfully',
      data: { liveQuiz }
    });
    
  } catch (error) {
    logger.error(`Error ending live quiz: ${error.message}`);
    next(error);
  }
};

/**
 * Get live quiz results
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route GET /api/live-quizzes/:id/results
 * @access Private
 */
exports.getLiveQuizResults = async (req, res, next) => {
  try {
    const liveQuiz = await LiveQuiz.findById(req.params.id);
    
    if (!liveQuiz) {
      return next(new ErrorResponse(`Resource not found`, 404));
    }
    
    // Make sure user is the host or admin
    if (liveQuiz.host._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to view results of this live quiz session', 403));
    }
    
    // Check if the quiz is completed
    if (liveQuiz.status !== 'completed') {
      return next(new ErrorResponse('Quiz is not completed yet', 400));
    }
    
    // Calculate participant rankings
    const participants = liveQuiz.participants
      .filter(p => p.isActive)
      .sort((a, b) => b.score - a.score)
      .map((participant, index) => ({
        name: participant.name,
        userId: participant.userId,
        score: participant.score,
        rank: index + 1,
        answeredQuestions: participant.answers.length,
        correctAnswers: participant.answers.filter(a => a.isCorrect).length
      }));
    
    // Calculate question statistics
    const questions = await Question.find({ quizId: liveQuiz.quiz._id });
    const questionStats = questions.map(question => {
      const result = liveQuiz.questionResults.find(
        qr => qr.questionId.toString() === question._id.toString()
      );
      
      return {
        questionId: question._id,
        questionText: question.questionText,
        correctAnswers: result ? result.correctAnswers : 0,
        incorrectAnswers: result ? result.incorrectAnswers : 0,
        averageResponseTime: result ? result.averageResponseTime : 0,
        optionDistribution: result ? result.optionDistribution : [],
        questionType: question.questionType,
        options: question.options
      };
    });
    
    // Calculate overall statistics
    const totalParticipants = participants.length;
    const averageScore = totalParticipants > 0 
      ? participants.reduce((sum, p) => sum + p.score, 0) / totalParticipants 
      : 0;
    
    const results = {
      quizTitle: liveQuiz.quiz.title,
      sessionCode: liveQuiz.sessionCode,
      status: liveQuiz.status,
      createdAt: liveQuiz.createdAt,
      participants,
      questionStats,
      summary: {
        totalParticipants,
        averageScore,
        totalQuestions: questions.length
      }
    };
    
    res.status(200).json({
      success: true,
      data: { results }
    });
    
  } catch (error) {
    logger.error(`Error fetching live quiz results: ${error.message}`);
    next(error);
  }
}; 