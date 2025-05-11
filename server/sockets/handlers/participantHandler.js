const LiveQuiz = require('../../models/LiveQuiz');
const logger = require('../../utils/logger');

/**
 * Socket.IO event handler for quiz participant events
 * @param {Object} socket - Socket.IO socket instance
 * @param {Object} io - Socket.IO namespace instance
 */
module.exports = (socket, io) => {
  // Participant sends a message in quiz chat
  socket.on('participant:send_message', async (data) => {
    try {
      const { sessionCode, message, name, userId } = data;
      
      logger.debug(`Chat message - User: ${name}, SessionCode: ${sessionCode}`);
      
      // Find the live quiz session
      const liveQuiz = await LiveQuiz.findOne({ sessionCode });
      
      if (!liveQuiz) {
        return socket.emit('participant:error', {
          message: 'Live quiz session not found'
        });
      }
      
      // Check if participant exists in the quiz
      const participantExists = liveQuiz.participants.some(p => 
        (userId && p.userId && p.userId.toString() === userId) || p.name === name
      );
      
      if (!participantExists) {
        return socket.emit('participant:error', {
          message: 'You are not a participant in this quiz session'
        });
      }
      
      // Broadcast the message to all participants in the room
      io.to(sessionCode).emit('quiz:chat_message', {
        sender: name,
        userId: userId || null,
        message,
        timestamp: new Date()
      });
      
      logger.debug(`Chat message sent - User: ${name}, SessionCode: ${sessionCode}`);
      
    } catch (error) {
      logger.error(`Error in participant:send_message: ${error.message}`);
      socket.emit('participant:error', {
        message: 'An error occurred while sending your message'
      });
    }
  });
  
  // Participant requests current quiz state
  socket.on('participant:get_status', async (data) => {
    try {
      const { sessionCode, name, userId } = data;
      
      logger.debug(`Status request - User: ${name}, SessionCode: ${sessionCode}`);
      
      // Find the live quiz session
      const liveQuiz = await LiveQuiz.findOne({ sessionCode });
      
      if (!liveQuiz) {
        return socket.emit('participant:error', {
          message: 'Live quiz session not found'
        });
      }
      
      // Check if participant exists in the quiz
      const participant = liveQuiz.participants.find(p => 
        (userId && p.userId && p.userId.toString() === userId) || p.name === name
      );
      
      if (!participant) {
        return socket.emit('participant:error', {
          message: 'You are not a participant in this quiz session'
        });
      }
      
      // Send current quiz status
      socket.emit('quiz:status', {
        status: liveQuiz.status,
        currentQuestion: liveQuiz.currentQuestion,
        participantCount: liveQuiz.participants.filter(p => p.isActive).length,
        yourScore: participant.score,
        // Only send minimal data about other participants
        participants: liveQuiz.participants
          .filter(p => p.isActive)
          .map(p => ({ name: p.name, userId: p.userId }))
      });
      
      logger.debug(`Status sent - User: ${name}, SessionCode: ${sessionCode}`);
      
    } catch (error) {
      logger.error(`Error in participant:get_status: ${error.message}`);
      socket.emit('participant:error', {
        message: 'An error occurred while getting quiz status'
      });
    }
  });
  
  // Participant requests feedback (during or after quiz)
  socket.on('participant:get_feedback', async (data) => {
    try {
      const { sessionCode, name, userId } = data;
      
      logger.debug(`Feedback request - User: ${name}, SessionCode: ${sessionCode}`);
      
      // Find the live quiz session
      const liveQuiz = await LiveQuiz.findOne({ sessionCode });
      
      if (!liveQuiz) {
        return socket.emit('participant:error', {
          message: 'Live quiz session not found'
        });
      }
      
      // Check if participant exists in the quiz
      const participant = liveQuiz.participants.find(p => 
        (userId && p.userId && p.userId.toString() === userId) || p.name === name
      );
      
      if (!participant) {
        return socket.emit('participant:error', {
          message: 'You are not a participant in this quiz session'
        });
      }
      
      // Calculate feedback statistics
      const totalQuestions = participant.answers.length;
      const correctAnswers = participant.answers.filter(a => a.isCorrect).length;
      const incorrectAnswers = totalQuestions - correctAnswers;
      const unansweredQuestions = liveQuiz.questionResults.length - totalQuestions;
      
      let averageTimePerQuestion = 0;
      if (totalQuestions > 0) {
        const totalTime = participant.answers.reduce((sum, a) => sum + a.timeTaken, 0);
        averageTimePerQuestion = totalTime / totalQuestions;
      }
      
      // Send feedback
      socket.emit('quiz:feedback', {
        totalQuestions: liveQuiz.questionResults.length,
        answeredQuestions: totalQuestions,
        correctAnswers,
        incorrectAnswers,
        unansweredQuestions,
        score: participant.score,
        averageTimePerQuestion,
        // Include all participants for ranking information
        rank: liveQuiz.participants
          .filter(p => p.isActive)
          .sort((a, b) => b.score - a.score)
          .findIndex(p => 
            (userId && p.userId && p.userId.toString() === userId) || p.name === name
          ) + 1
      });
      
      logger.debug(`Feedback sent - User: ${name}, SessionCode: ${sessionCode}`);
      
    } catch (error) {
      logger.error(`Error in participant:get_feedback: ${error.message}`);
      socket.emit('participant:error', {
        message: 'An error occurred while getting your feedback'
      });
    }
  });
}; 