const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Socket.IO Configuration
 * @param {Object} server - HTTP server instance
 * @returns {Object} - Socket.IO instance
 */
module.exports = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication middleware for Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      logger.warn('Socket connection attempt without token');
      return next(new Error('Authentication error: Token missing'));
    }
    
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      logger.debug(`Socket authenticated: User ID ${decoded.id}`);
      next();
    } catch (error) {
      logger.warn(`Socket authentication error: ${error.message}`);
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  // Create the live quiz namespace
  const liveQuiz = io.of('/live-quiz');
  
  liveQuiz.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}, User: ${socket.user.id}`);
    
    // Set up event handlers - these will be imported from socket handlers
    const liveQuizHandler = require('../sockets/handlers/liveQuizHandler');
    const participantHandler = require('../sockets/handlers/participantHandler');
    const hostHandler = require('../sockets/handlers/hostHandler');
    
    liveQuizHandler(socket, liveQuiz);
    participantHandler(socket, liveQuiz);
    hostHandler(socket, liveQuiz);
    
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}, User: ${socket.user.id}`);
    });
  });

  return io;
}; 