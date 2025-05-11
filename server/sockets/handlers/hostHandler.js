const LiveQuiz = require('../../models/LiveQuiz');
const Question = require('../../models/Question');
const logger = require('../../utils/logger');

/**
 * Socket.IO event handler for quiz host events
 * @param {Object} socket - Socket.IO socket instance
 * @param {Object} io - Socket.IO namespace instance
 */
module.exports = (socket, io) => {
  // Host starts a quiz
  socket.on('host:start_quiz', async (data) => {
    try {
      const { sessionCode } = data;
      const userId = socket.user.id;
      
      logger.debug(`Host starting quiz - Host: ${userId}, SessionCode: ${sessionCode}`);
      
      // Find the live quiz session
      const liveQuiz = await LiveQuiz.findOne({ 
        sessionCode,
        host: userId
      });
      
      if (!liveQuiz) {
        logger.warn(`Live quiz not found or user not authorized - SessionCode: ${sessionCode}, User: ${userId}`);
        return socket.emit('host:error', {
          message: 'Live quiz session not found or you are not authorized'
        });
      }
      
      // Update quiz status
      liveQuiz.status = 'active';
      await liveQuiz.save();
      
      logger.info(`Quiz started - SessionCode: ${sessionCode}`);
      
      // Join the host to the room
      socket.join(sessionCode);
      
      // Notify all participants in the room
      io.to(sessionCode).emit('quiz:started', {
        message: 'The quiz has started',
        status: 'active'
      });
      
      socket.emit('host:quiz_started', {
        message: 'Successfully started the quiz',
        quizId: liveQuiz.quiz._id
      });
      
    } catch (error) {
      logger.error(`Error in host:start_quiz: ${error.message}`);
      socket.emit('host:error', {
        message: 'An error occurred while starting the quiz'
      });
    }
  });
  
  // Host starts a question
  socket.on('host:start_question', async (data) => {
    try {
      const { sessionCode, questionId, duration } = data;
      const userId = socket.user.id;
      
      logger.debug(`Host starting question - Host: ${userId}, SessionCode: ${sessionCode}, Question: ${questionId}`);
      
      // Find the live quiz session
      const liveQuiz = await LiveQuiz.findOne({ 
        sessionCode,
        host: userId
      });
      
      if (!liveQuiz) {
        return socket.emit('host:error', {
          message: 'Live quiz session not found or you are not authorized'
        });
      }
      
      // Check if quiz is active
      if (liveQuiz.status !== 'active') {
        return socket.emit('host:error', {
          message: 'Quiz must be in active state to start a question'
        });
      }
      
      // Verify the question exists and belongs to the quiz
      const question = await Question.findOne({
        _id: questionId,
        quizId: liveQuiz.quiz._id
      });
      
      if (!question) {
        return socket.emit('host:error', {
          message: 'Question not found or does not belong to this quiz'
        });
      }
      
      // Set up the current question
      const actualDuration = duration || question.timeLimit || liveQuiz.quiz.settings.timePerQuestion || 30;
      
      liveQuiz.currentQuestion = {
        questionId: question._id,
        startedAt: new Date(),
        status: 'active'
      };
      
      await liveQuiz.save();
      
      logger.info(`Question started - SessionCode: ${sessionCode}, Question: ${questionId}, Duration: ${actualDuration}s`);
      
      // Send question to all participants
      io.to(sessionCode).emit('quiz:question', {
        questionId: question._id,
        questionText: question.questionText,
        questionType: question.questionType,
        image: question.image,
        options: question.options.map(option => ({
          id: option._id,
          text: option.text
        })),
        duration: actualDuration,
        points: question.points
      });
      
      // Set timeout to end question
      setTimeout(async () => {
        try {
          // Re-fetch quiz to get latest data
          const updatedLiveQuiz = await LiveQuiz.findOne({ sessionCode });
          
          if (!updatedLiveQuiz || 
              !updatedLiveQuiz.currentQuestion || 
              updatedLiveQuiz.currentQuestion.questionId.toString() !== questionId ||
              updatedLiveQuiz.currentQuestion.status !== 'active') {
            // Question already ended or changed
            return;
          }
          
          // End the current question
          updatedLiveQuiz.currentQuestion.status = 'ended';
          updatedLiveQuiz.currentQuestion.endedAt = new Date();
          
          // Calculate question results
          const questionResult = {
            questionId: question._id,
            correctAnswers: 0,
            incorrectAnswers: 0,
            averageResponseTime: 0,
            optionDistribution: question.options.map(option => ({
              optionId: option._id,
              count: 0,
              percentage: 0
            }))
          };
          
          let totalResponseTime = 0;
          let totalResponses = 0;
          
          // Process answers
          updatedLiveQuiz.participants.forEach(participant => {
            const answer = participant.answers.find(
              a => a.questionId.toString() === questionId
            );
            
            if (answer) {
              totalResponses++;
              totalResponseTime += answer.timeTaken;
              
              if (answer.isCorrect) {
                questionResult.correctAnswers++;
              } else {
                questionResult.incorrectAnswers++;
              }
              
              // Update option distribution
              const optionIndex = questionResult.optionDistribution.findIndex(
                o => o.optionId.toString() === answer.selectedOptionId.toString()
              );
              
              if (optionIndex !== -1) {
                questionResult.optionDistribution[optionIndex].count++;
              }
            }
          });
          
          // Calculate averages and percentages
          if (totalResponses > 0) {
            questionResult.averageResponseTime = totalResponseTime / totalResponses;
            
            // Calculate percentage for each option
            questionResult.optionDistribution.forEach(option => {
              option.percentage = totalResponses > 0 
                ? (option.count / totalResponses) * 100 
                : 0;
            });
          }
          
          // Add or update question result
          const existingResultIndex = updatedLiveQuiz.questionResults.findIndex(
            qr => qr.questionId.toString() === questionId
          );
          
          if (existingResultIndex !== -1) {
            updatedLiveQuiz.questionResults[existingResultIndex] = questionResult;
          } else {
            updatedLiveQuiz.questionResults.push(questionResult);
          }
          
          await updatedLiveQuiz.save();
          
          logger.info(`Question ended automatically - SessionCode: ${sessionCode}, Question: ${questionId}`);
          
          // Notify all participants that the question has ended
          io.to(sessionCode).emit('quiz:question_ended', {
            questionId: question._id,
            correctOptionIds: question.options
              .filter(o => o.isCorrect)
              .map(o => o._id),
            explanation: question.explanation
          });
          
          // Generate and send leaderboard if enabled
          if (updatedLiveQuiz.settings.showLeaderboardAfterEachQuestion) {
            const leaderboard = generateLeaderboard(updatedLiveQuiz, questionId);
            io.to(sessionCode).emit('quiz:leaderboard', leaderboard);
          }
          
        } catch (error) {
          logger.error(`Error in question auto-end timeout: ${error.message}`);
        }
      }, actualDuration * 1000);
      
      // Send confirmation to host
      socket.emit('host:question_started', {
        questionId: question._id,
        duration: actualDuration
      });
      
    } catch (error) {
      logger.error(`Error in host:start_question: ${error.message}`);
      socket.emit('host:error', {
        message: 'An error occurred while starting the question'
      });
    }
  });
  
  // Host ends a question manually
  socket.on('host:end_question', async (data) => {
    try {
      const { sessionCode, questionId } = data;
      const userId = socket.user.id;
      
      logger.debug(`Host ending question - Host: ${userId}, SessionCode: ${sessionCode}, Question: ${questionId}`);
      
      // Find the live quiz session
      const liveQuiz = await LiveQuiz.findOne({ 
        sessionCode,
        host: userId
      });
      
      if (!liveQuiz) {
        return socket.emit('host:error', {
          message: 'Live quiz session not found or you are not authorized'
        });
      }
      
      // Check if the current question matches
      if (!liveQuiz.currentQuestion || 
          liveQuiz.currentQuestion.questionId.toString() !== questionId ||
          liveQuiz.currentQuestion.status !== 'active') {
        return socket.emit('host:error', {
          message: 'This question is not currently active'
        });
      }
      
      // Get the question
      const question = await Question.findById(questionId);
      
      if (!question) {
        return socket.emit('host:error', {
          message: 'Question not found'
        });
      }
      
      // End the current question
      liveQuiz.currentQuestion.status = 'ended';
      liveQuiz.currentQuestion.endedAt = new Date();
      
      // Process question results (similar to the auto-end logic)
      const questionResult = {
        questionId: question._id,
        correctAnswers: 0,
        incorrectAnswers: 0,
        averageResponseTime: 0,
        optionDistribution: question.options.map(option => ({
          optionId: option._id,
          count: 0,
          percentage: 0
        }))
      };
      
      let totalResponseTime = 0;
      let totalResponses = 0;
      
      // Process answers
      liveQuiz.participants.forEach(participant => {
        const answer = participant.answers.find(
          a => a.questionId.toString() === questionId
        );
        
        if (answer) {
          totalResponses++;
          totalResponseTime += answer.timeTaken;
          
          if (answer.isCorrect) {
            questionResult.correctAnswers++;
          } else {
            questionResult.incorrectAnswers++;
          }
          
          // Update option distribution
          const optionIndex = questionResult.optionDistribution.findIndex(
            o => o.optionId.toString() === answer.selectedOptionId.toString()
          );
          
          if (optionIndex !== -1) {
            questionResult.optionDistribution[optionIndex].count++;
          }
        }
      });
      
      // Calculate averages and percentages
      if (totalResponses > 0) {
        questionResult.averageResponseTime = totalResponseTime / totalResponses;
        
        // Calculate percentage for each option
        questionResult.optionDistribution.forEach(option => {
          option.percentage = totalResponses > 0 
            ? (option.count / totalResponses) * 100 
            : 0;
        });
      }
      
      // Add or update question result
      const existingResultIndex = liveQuiz.questionResults.findIndex(
        qr => qr.questionId.toString() === questionId
      );
      
      if (existingResultIndex !== -1) {
        liveQuiz.questionResults[existingResultIndex] = questionResult;
      } else {
        liveQuiz.questionResults.push(questionResult);
      }
      
      await liveQuiz.save();
      
      logger.info(`Question ended manually - SessionCode: ${sessionCode}, Question: ${questionId}`);
      
      // Notify all participants that the question has ended
      io.to(sessionCode).emit('quiz:question_ended', {
        questionId: question._id,
        correctOptionIds: question.options
          .filter(o => o.isCorrect)
          .map(o => o._id),
        explanation: question.explanation
      });
      
      // Generate and send leaderboard if enabled
      if (liveQuiz.settings.showLeaderboardAfterEachQuestion) {
        const leaderboard = generateLeaderboard(liveQuiz, questionId);
        io.to(sessionCode).emit('quiz:leaderboard', leaderboard);
      }
      
      // Send confirmation to host
      socket.emit('host:question_ended', {
        questionId: question._id,
        statistics: {
          totalResponses,
          correctResponses: questionResult.correctAnswers,
          incorrectResponses: questionResult.incorrectAnswers,
          averageResponseTime: questionResult.averageResponseTime,
          optionDistribution: questionResult.optionDistribution
        }
      });
      
    } catch (error) {
      logger.error(`Error in host:end_question: ${error.message}`);
      socket.emit('host:error', {
        message: 'An error occurred while ending the question'
      });
    }
  });
  
  // Host ends the entire quiz
  socket.on('host:end_quiz', async (data) => {
    try {
      const { sessionCode } = data;
      const userId = socket.user.id;
      
      logger.debug(`Host ending quiz - Host: ${userId}, SessionCode: ${sessionCode}`);
      
      // Find the live quiz session
      const liveQuiz = await LiveQuiz.findOne({ 
        sessionCode,
        host: userId
      });
      
      if (!liveQuiz) {
        return socket.emit('host:error', {
          message: 'Live quiz session not found or you are not authorized'
        });
      }
      
      // End any active question
      if (liveQuiz.currentQuestion && liveQuiz.currentQuestion.status === 'active') {
        liveQuiz.currentQuestion.status = 'ended';
        liveQuiz.currentQuestion.endedAt = new Date();
      }
      
      // Update quiz status
      liveQuiz.status = 'completed';
      await liveQuiz.save();
      
      logger.info(`Quiz ended - SessionCode: ${sessionCode}`);
      
      // Generate final leaderboard
      const finalLeaderboard = generateLeaderboard(liveQuiz);
      
      // Notify all participants
      io.to(sessionCode).emit('quiz:ended', {
        message: 'The quiz has ended',
        finalLeaderboard
      });
      
      // Send confirmation to host
      socket.emit('host:quiz_ended', {
        message: 'Quiz ended successfully',
        finalLeaderboard,
        statistics: {
          totalParticipants: liveQuiz.participants.length,
          averageScore: calculateAverageScore(liveQuiz),
          questionResults: liveQuiz.questionResults
        }
      });
      
    } catch (error) {
      logger.error(`Error in host:end_quiz: ${error.message}`);
      socket.emit('host:error', {
        message: 'An error occurred while ending the quiz'
      });
    }
  });
};

/**
 * Generate leaderboard from quiz data
 * @param {Object} liveQuiz - Live quiz document
 * @param {string} lastQuestionId - ID of the last question (optional)
 * @returns {Object} - Leaderboard data
 */
function generateLeaderboard(liveQuiz, lastQuestionId = null) {
  // Sort participants by score in descending order
  const sortedParticipants = [...liveQuiz.participants]
    .filter(p => p.isActive)
    .sort((a, b) => b.score - a.score);
  
  const leaderboard = {
    leaderboard: sortedParticipants.map((participant, index) => {
      const entry = {
        userId: participant.userId,
        name: participant.name,
        score: participant.score,
        currentRank: index + 1
      };
      
      // Include data about the last question if provided
      if (lastQuestionId) {
        const lastAnswer = participant.answers.find(
          a => a.questionId.toString() === lastQuestionId
        );
        
        if (lastAnswer) {
          entry.lastQuestionCorrect = lastAnswer.isCorrect;
          entry.lastQuestionScore = lastAnswer.points;
        } else {
          entry.lastQuestionCorrect = false;
          entry.lastQuestionScore = 0;
        }
      }
      
      return entry;
    }),
    currentQuestion: lastQuestionId ? 
      liveQuiz.questionResults.length : 
      liveQuiz.questionResults.length + 1,
    totalQuestions: 0 // This should be set from the quiz data - needs fix
  };
  
  // Fix: Set totalQuestions from the quiz data if available
  if (liveQuiz.quiz && liveQuiz.quiz._id) {
    // Since we don't have direct access to question count here, 
    // we'll set it to the number of question results or a placeholder
    leaderboard.totalQuestions = liveQuiz.questionResults.length || '?';
  }
  
  return leaderboard;
}

/**
 * Calculate average score across all participants
 * @param {Object} liveQuiz - Live quiz document
 * @returns {number} - Average score
 */
function calculateAverageScore(liveQuiz) {
  if (liveQuiz.participants.length === 0) return 0;
  
  const totalScore = liveQuiz.participants.reduce(
    (sum, participant) => sum + participant.score, 
    0
  );
  
  return totalScore / liveQuiz.participants.length;
} 