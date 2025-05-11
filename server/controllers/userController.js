const User = require('../models/User');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const ErrorResponse = require('../utils/errorResponse');
const logger = require('../utils/logger');

/**
 * Get user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route GET /api/users/profile
 * @access Private
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    res.status(200).json({
      success: true,
      data: { user }
    });
    
  } catch (error) {
    logger.error(`Error fetching user profile: ${error.message}`);
    next(error);
  }
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route PUT /api/users/profile
 * @access Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    // Define allowed update fields
    const allowedUpdates = {
      name: req.body.name,
      profilePicture: req.body.profilePicture
    };
    
    // Remove undefined fields
    Object.keys(allowedUpdates).forEach(key => 
      allowedUpdates[key] === undefined && delete allowedUpdates[key]
    );
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      allowedUpdates,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    logger.info(`User profile updated: ${user._id}`);
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
    
  } catch (error) {
    logger.error(`Error updating user profile: ${error.message}`);
    next(error);
  }
};

/**
 * Change user password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route PUT /api/users/change-password
 * @access Private
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validation
    if (!currentPassword || !newPassword) {
      return next(new ErrorResponse('Please provide both current and new password', 400));
    }
    
    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Check if current password matches
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return next(new ErrorResponse('Current password is incorrect', 401));
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    logger.info(`Password changed for user: ${user._id}`);
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
    
  } catch (error) {
    logger.error(`Error changing password: ${error.message}`);
    next(error);
  }
};

/**
 * Get user dashboard stats
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route GET /api/users/dashboard
 * @access Private
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Get quiz count
    const quizCount = await Quiz.countDocuments({ creator: req.user.id });
    
    // Get published quiz count
    const publishedQuizCount = await Quiz.countDocuments({ 
      creator: req.user.id,
      isPublished: true
    });
    
    // Get total attempts
    const totalAttempts = await QuizAttempt.countDocuments({ 
      user: req.user.id,
      completed: true
    });
    
    // Get recent quizzes
    const recentQuizzes = await Quiz.find({ creator: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get recent attempts
    const recentAttempts = await QuizAttempt.find({ 
      user: req.user.id,
      completed: true
    })
      .populate({
        path: 'quiz',
        select: 'title creator',
        populate: {
          path: 'creator',
          select: 'name'
        }
      })
      .sort({ completedAt: -1 })
      .limit(5);
    
    // Calculate average score
    const attempts = await QuizAttempt.find({ 
      user: req.user.id,
      completed: true
    });
    
    let averageScore = 0;
    if (attempts.length > 0) {
      const totalScore = attempts.reduce((sum, attempt) => sum + attempt.percentageScore, 0);
      averageScore = totalScore / attempts.length;
    }
    
    const dashboardStats = {
      quizCount,
      publishedQuizCount,
      totalAttempts,
      averageScore,
      recentQuizzes: recentQuizzes.map(quiz => ({
        id: quiz._id,
        title: quiz.title,
        isPublished: quiz.isPublished,
        createdAt: quiz.createdAt
      })),
      recentAttempts: recentAttempts.map(attempt => ({
        id: attempt._id,
        quiz: {
          id: attempt.quiz._id,
          title: attempt.quiz.title,
          creator: attempt.quiz.creator.name
        },
        score: attempt.percentageScore,
        passed: attempt.passed,
        completedAt: attempt.completedAt
      }))
    };
    
    res.status(200).json({
      success: true,
      data: { dashboardStats }
    });
    
  } catch (error) {
    logger.error(`Error fetching dashboard stats: ${error.message}`);
    next(error);
  }
};

/**
 * Delete user account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route DELETE /api/users/account
 * @access Private
 */
exports.deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Before deleting account, you might want to implement additional logic
    // 1. Delete all user's quizzes (and their questions)
    // 2. Delete all user's attempts
    // 3. Delete all user's question bank entries
    // etc.
    
    // For now, just delete the user account
    await user.remove();
    
    logger.info(`User account deleted: ${req.user.id}`);
    
    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
    
  } catch (error) {
    logger.error(`Error deleting user account: ${error.message}`);
    next(error);
  }
};

/**
 * Get all quiz attempts by the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route GET /api/users/me/attempts
 * @access Private
 */
exports.getUserAttempts = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Sorting
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    
    // Create query object
    const queryObj = { user: req.user.id };
    
    // Execute query
    const total = await QuizAttempt.countDocuments(queryObj);
    
    const attempts = await QuizAttempt.find(queryObj)
      .populate({
        path: 'quiz',
        select: 'title description coverImage'
      })
      .skip(startIndex)
      .limit(limit)
      .sort({ [sort]: order });
    
    // Format attempts
    const formattedAttempts = attempts.map(attempt => ({
      _id: attempt._id,
      quiz: {
        _id: attempt.quiz._id,
        title: attempt.quiz.title
      },
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentageScore: attempt.percentageScore,
      passed: attempt.passed,
      completed: attempt.completed,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt
    }));
    
    // Pagination result
    const pagination = {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
    
    res.status(200).json({
      success: true,
      data: {
        attempts: formattedAttempts,
        pagination
      }
    });
    
  } catch (error) {
    logger.error(`Error fetching user attempts: ${error.message}`);
    next(error);
  }
};

/**
 * Get user's quiz statistics and analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @route GET /api/users/me/statistics
 * @access Private
 */
exports.getUserStatistics = async (req, res, next) => {
  try {
    // Get all quiz attempts
    const allAttempts = await QuizAttempt.find({ user: req.user.id })
      .populate({
        path: 'quiz',
        select: 'title tags'
      });
    
    // Get user's created quizzes
    const userQuizzes = await Quiz.find({ creator: req.user.id });
    
    // Calculate total time played (in minutes)
    let totalTimePlayed = 0;
    
    allAttempts.forEach(attempt => {
      if (attempt.startedAt && attempt.completedAt) {
        const timeTaken = Math.abs(new Date(attempt.completedAt) - new Date(attempt.startedAt)) / 60000; // minutes
        totalTimePlayed += timeTaken;
      }
    });
    
    // Format time played
    const hours = Math.floor(totalTimePlayed / 60);
    const minutes = Math.floor(totalTimePlayed % 60);
    const formattedTimePlayed = `${hours}h ${minutes}m`;
    
    // Calculate average score
    const completedAttempts = allAttempts.filter(attempt => attempt.completed);
    let averageScore = 0;
    
    if (completedAttempts.length > 0) {
      const totalScore = completedAttempts.reduce((sum, attempt) => sum + attempt.percentageScore, 0);
      averageScore = parseFloat((totalScore / completedAttempts.length).toFixed(1));
    }
    
    // Calculate favorite tags
    const tagCounts = {};
    
    completedAttempts.forEach(attempt => {
      if (attempt.quiz && attempt.quiz.tags) {
        attempt.quiz.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    const favoriteTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);
    
    // Calculate monthly performance
    const monthlyData = {};
    
    completedAttempts.forEach(attempt => {
      const date = new Date(attempt.completedAt);
      const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          month: new Date(date.getFullYear(), date.getMonth(), 1).toLocaleString('default', { month: 'long' }),
          year: date.getFullYear(),
          quizzesTaken: 0,
          totalScore: 0
        };
      }
      
      monthlyData[monthYear].quizzesTaken++;
      monthlyData[monthYear].totalScore += attempt.percentageScore;
    });
    
    const monthlyPerformance = Object.values(monthlyData)
      .map(data => ({
        month: data.month,
        year: data.year,
        quizzesTaken: data.quizzesTaken,
        averageScore: parseFloat((data.totalScore / data.quizzesTaken).toFixed(1))
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return new Date(0, a.month, 0) - new Date(0, b.month, 0);
      })
      .slice(-6); // Last 6 months
    
    // Calculate performance by tags
    const tagPerformance = {};
    
    completedAttempts.forEach(attempt => {
      if (attempt.quiz && attempt.quiz.tags) {
        attempt.quiz.tags.forEach(tag => {
          if (!tagPerformance[tag]) {
            tagPerformance[tag] = {
              tag,
              attemptCount: 0,
              totalScore: 0
            };
          }
          
          tagPerformance[tag].attemptCount++;
          tagPerformance[tag].totalScore += attempt.percentageScore;
        });
      }
    });
    
    const byTags = Object.values(tagPerformance)
      .map(data => ({
        tag: data.tag,
        attemptCount: data.attemptCount,
        averageScore: parseFloat((data.totalScore / data.attemptCount).toFixed(1))
      }))
      .sort((a, b) => b.attemptCount - a.attemptCount)
      .slice(0, 5); // Top 5 tags
    
    // Compile statistics
    const statistics = {
      overview: {
        totalQuizzesTaken: completedAttempts.length,
        totalQuizzesCreated: userQuizzes.length,
        averageScore,
        totalTimePlayed: formattedTimePlayed,
        favoriteTags
      },
      quizzesTaken: {
        completed: completedAttempts.length,
        inProgress: allAttempts.filter(attempt => !attempt.completed).length,
        passed: completedAttempts.filter(attempt => attempt.passed).length,
        failed: completedAttempts.filter(attempt => !attempt.passed).length
      },
      quizzesCreated: {
        total: userQuizzes.length,
        published: userQuizzes.filter(quiz => quiz.isPublished).length,
        drafts: userQuizzes.filter(quiz => !quiz.isPublished).length,
        // Advanced statistics would require additional queries:
        totalAttempts: 0, // Placeholder, would need to count all attempts on user's quizzes
        averageScore: 0 // Placeholder, would need to calculate from all attempts
      },
      performance: {
        monthly: monthlyPerformance,
        byTags
      }
    };
    
    res.status(200).json({
      success: true,
      data: statistics
    });
    
  } catch (error) {
    logger.error(`Error fetching user statistics: ${error.message}`);
    next(error);
  }
}; 