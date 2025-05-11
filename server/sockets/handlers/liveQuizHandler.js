const LiveQuiz = require('../../models/LiveQuiz');
const Question = require('../../models/Question');
const logger = require('../../utils/logger');

/**
 * Socket.IO event handler for live quiz events
 * @param {Object} socket - Socket.IO socket instance
 * @param {Object} io - Socket.IO namespace instance
 */
module.exports = (socket, io) => {
  // Join a live quiz room
  socket.on('quiz:join', async (data) => {
    try {
      const { sessionCode, name, userId } = data;
      
      logger.debug(`User joining quiz - Name: ${name}, UserId: ${userId}, SessionCode: ${sessionCode}`);
      
      // Find the live quiz session
      const liveQuiz = await LiveQuiz.findOne({ sessionCode });
      
      if (!liveQuiz) {
        logger.warn(`Live quiz not found with session code: ${sessionCode}`);
        return socket.emit('quiz:error', {
          message: 'Live quiz session not found'
        });
      }
      
      // Check if quiz is accepting participants
      if (liveQuiz.status === 'completed') {
        logger.warn(`Attempted to join completed quiz: ${sessionCode}`);
        return socket.emit('quiz:error', {
          message: 'This quiz session has ended'
        });
      }
      
      // Check participant limit
      if (liveQuiz.participants.length >= liveQuiz.settings.participantLimit) {
        logger.warn(`Participant limit reached for quiz: ${sessionCode}`);
        return socket.emit('quiz:error', {
          message: 'This quiz session has reached its participant limit'
        });
      }
      
      // Join the socket room
      socket.join(sessionCode);
      
      // Check if participant exists
      const existingParticipant = liveQuiz.participants.find(p => 
        (userId && p.userId && p.userId.toString() === userId) || p.name === name
      );
      
      if (existingParticipant) {
        // Reactivate existing participant
        existingParticipant.isActive = true;
        
        logger.info(`Participant rejoined: ${name} in session ${sessionCode}`);
        
        await liveQuiz.save();
        
        socket.emit('quiz:joined', {
          message: 'Rejoined quiz session',
          quizDetails: {
            title: liveQuiz.quiz.title,
            description: liveQuiz.quiz.description,
            hostName: liveQuiz.host.name,
            status: liveQuiz.status,
            currentQuestion: liveQuiz.currentQuestion,
            sessionCode
          },
          participantInfo: {
            name: existingParticipant.name,
            score: existingParticipant.score,
            userId: existingParticipant.userId
          }
        });
      } else {
        // Add new participant
        const newParticipant = {
          name,
          joinedAt: new Date(),
          score: 0,
          isActive: true
        };
        
        if (userId) {
          newParticipant.userId = userId;
        }
        
        liveQuiz.participants.push(newParticipant);
        
        logger.info(`New participant joined: ${name} in session ${sessionCode}`);
        
        await liveQuiz.save();
        
        socket.emit('quiz:joined', {
          message: 'Successfully joined quiz session',
          quizDetails: {
            title: liveQuiz.quiz.title,
            description: liveQuiz.quiz.description,
            hostName: liveQuiz.host.name,
            status: liveQuiz.status,
            currentQuestion: liveQuiz.currentQuestion,
            sessionCode
          },
          participantInfo: {
            name: newParticipant.name,
            score: newParticipant.score,
            userId: newParticipant.userId
          }
        });
      }
      
      // Broadcast to room that a new participant joined
      io.to(sessionCode).emit('quiz:participant_update', {
        count: liveQuiz.participants.filter(p => p.isActive).length,
        participants: liveQuiz.participants
          .filter(p => p.isActive)
          .map(p => ({ name: p.name, score: p.score, userId: p.userId }))
      });
      
    } catch (error) {
      logger.error(`Error in quiz:join: ${error.message}`);
      socket.emit('quiz:error', {
        message: 'An error occurred while joining the quiz'
      });
    }
  });
  
  // Leave a live quiz
  socket.on('quiz:leave', async (data) => {
    try {
      const { sessionCode, name, userId } = data;
      
      logger.debug(`User leaving quiz - Name: ${name}, UserId: ${userId}, SessionCode: ${sessionCode}`);
      
      // Find the live quiz session
      const liveQuiz = await LiveQuiz.findOne({ sessionCode });
      
      if (!liveQuiz) {
        return socket.emit('quiz:error', {
          message: 'Live quiz session not found'
        });
      }
      
      // Leave the socket room
      socket.leave(sessionCode);
      
      // Set participant as inactive
      const participantIndex = liveQuiz.participants.findIndex(p => 
        (userId && p.userId && p.userId.toString() === userId) || p.name === name
      );
      
      if (participantIndex !== -1) {
        liveQuiz.participants[participantIndex].isActive = false;
        
        await liveQuiz.save();
        
        logger.info(`Participant left: ${name} from session ${sessionCode}`);
        
        // Broadcast updated participant list
        io.to(sessionCode).emit('quiz:participant_update', {
          count: liveQuiz.participants.filter(p => p.isActive).length,
          participants: liveQuiz.participants
            .filter(p => p.isActive)
            .map(p => ({ name: p.name, score: p.score, userId: p.userId }))
        });
      }
      
      socket.emit('quiz:left', {
        message: 'Successfully left quiz session'
      });
      
    } catch (error) {
      logger.error(`Error in quiz:leave: ${error.message}`);
      socket.emit('quiz:error', {
        message: 'An error occurred while leaving the quiz'
      });
    }
  });
  
  // Submit answer
  socket.on('quiz:submit_answer', async (data) => {
    try {
      const { sessionCode, questionId, selectedOptionId, name, userId } = data;
      
      logger.debug(`Answer submission - User: ${name}, SessionCode: ${sessionCode}, Question: ${questionId}`);
      
      const liveQuiz = await LiveQuiz.findOne({ sessionCode });
      
      if (!liveQuiz) {
        return socket.emit('quiz:error', {
          message: 'Live quiz session not found'
        });
      }
      
      // Check if current question matches
      if (!liveQuiz.currentQuestion || 
          liveQuiz.currentQuestion.questionId.toString() !== questionId ||
          liveQuiz.currentQuestion.status !== 'active') {
        return socket.emit('quiz:error', {
          message: 'This question is not currently active'
        });
      }
      
      // Check if participant exists
      const participantIndex = liveQuiz.participants.findIndex(p => 
        (userId && p.userId && p.userId.toString() === userId) || p.name === name
      );
      
      if (participantIndex === -1) {
        return socket.emit('quiz:error', {
          message: 'Participant not found in this quiz session'
        });
      }
      
      // Check if already answered
      const hasAnswered = liveQuiz.participants[participantIndex].answers.some(
        a => a.questionId.toString() === questionId
      );
      
      if (hasAnswered && !liveQuiz.settings.allowRetry) {
        return socket.emit('quiz:error', {
          message: 'You have already answered this question'
        });
      }
      
      // Get the question from database
      const question = await Question.findById(questionId);
      
      if (!question) {
        return socket.emit('quiz:error', {
          message: 'Question not found'
        });
      }
      
      // Find the selected option
      const selectedOption = question.options.find(
        option => option._id.toString() === selectedOptionId
      );
      
      if (!selectedOption) {
        return socket.emit('quiz:error', {
          message: 'Selected option not found'
        });
      }
      
      // Calculate time taken
      const startTime = new Date(liveQuiz.currentQuestion.startedAt).getTime();
      const answerTime = new Date().getTime();
      const timeTaken = Math.floor((answerTime - startTime) / 1000); // in seconds
      
      // Calculate points based on scoring mode
      let points = 0;
      
      if (selectedOption.isCorrect) {
        if (liveQuiz.quiz.settings.scoringMode === 'time-based') {
          // Calculate time-based score (faster = more points)
          const maxTime = liveQuiz.quiz.settings.timePerQuestion || 30;
          points = Math.max(
            Math.ceil(question.points * (1 - timeTaken / maxTime)),
            Math.ceil(question.points * 0.2) // minimum 20% of points
          );
        } else {
          // Standard scoring
          points = question.points;
        }
      }
      
      // Add or update answer
      const answerData = {
        questionId,
        selectedOptionId,
        isCorrect: selectedOption.isCorrect,
        timeTaken,
        points,
        answeredAt: new Date()
      };
      
      // Remove existing answer if allowed to retry
      if (hasAnswered && liveQuiz.settings.allowRetry) {
        // Find and remove the existing answer
        const answerIndex = liveQuiz.participants[participantIndex].answers.findIndex(
          a => a.questionId.toString() === questionId
        );
        
        if (answerIndex !== -1) {
          // Subtract previous points from score
          liveQuiz.participants[participantIndex].score -= 
            liveQuiz.participants[participantIndex].answers[answerIndex].points;
          
          // Remove the answer
          liveQuiz.participants[participantIndex].answers.splice(answerIndex, 1);
        }
      }
      
      // Add the new answer
      liveQuiz.participants[participantIndex].answers.push(answerData);
      
      // Update participant score
      liveQuiz.participants[participantIndex].score += points;
      
      await liveQuiz.save();
      
      logger.info(`Answer submitted - User: ${name}, Correct: ${selectedOption.isCorrect}, Points: ${points}`);
      
      // Send response to participant
      socket.emit('quiz:answer_result', {
        isCorrect: selectedOption.isCorrect,
        points,
        totalScore: liveQuiz.participants[participantIndex].score
      });
      
    } catch (error) {
      logger.error(`Error in quiz:submit_answer: ${error.message}`);
      socket.emit('quiz:error', {
        message: 'An error occurred while submitting your answer'
      });
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
}; 