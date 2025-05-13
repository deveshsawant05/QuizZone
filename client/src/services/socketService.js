import io from 'socket.io-client';

// Socket.IO server URL - adjust based on environment
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

/**
 * Initialize socket connection
 * @param {string} token - JWT auth token
 * @returns {object} socket instance
 */
export const initializeSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  // Create new socket connection
  socket = io(`${SOCKET_URL}/live-quiz`, {
    auth: {
      token
    },
    transports: ['websocket'],
    autoConnect: true
  });

  // Setup event listeners
  socket.on('connect', () => {
    console.log('Socket connected!');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join a live quiz room
 * @param {string} roomCode - Room code
 * @param {string} name - Participant name
 */
export const joinRoom = (roomCode, name) => {
  if (!socket) return;
  socket.emit('join:room', { roomCode, name });
};

/**
 * Leave current room
 * @param {string} roomId - Room ID to leave
 */
export const leaveRoom = (roomId) => {
  if (!socket) return;
  socket.emit('leave:room', { roomId });
};

/**
 * Set ready status for participant
 * @param {string} roomId - Room ID
 * @param {boolean} ready - Ready status
 */
export const setReadyStatus = (roomId, ready) => {
  if (!socket) return;
  socket.emit('ready:status', { roomId, ready });
};

/**
 * Submit answer for current question
 * @param {string} roomId - Room ID
 * @param {string} questionId - Question ID
 * @param {string} answerId - Selected answer ID
 * @param {number} timeTaken - Time taken to answer in seconds
 */
export const submitAnswer = (roomId, questionId, answerId, timeTaken) => {
  if (!socket) return;
  socket.emit('submit:answer', { roomId, questionId, answerId, timeTaken });
};

// Host-specific actions

/**
 * Start the quiz (host only)
 * @param {string} roomId - Room ID
 */
export const startQuiz = (roomId) => {
  if (!socket) return;
  socket.emit('host:start-quiz', { roomId });
};

/**
 * Move to the next question (host only)
 * @param {string} roomId - Room ID
 */
export const nextQuestion = (roomId) => {
  if (!socket) return;
  socket.emit('host:next-question', { roomId });
};

/**
 * Pause the quiz (host only)
 * @param {string} roomId - Room ID
 */
export const pauseQuiz = (roomId) => {
  if (!socket) return;
  socket.emit('host:pause-quiz', { roomId });
};

/**
 * Resume the quiz (host only)
 * @param {string} roomId - Room ID
 */
export const resumeQuiz = (roomId) => {
  if (!socket) return;
  socket.emit('host:resume-quiz', { roomId });
};

/**
 * End the quiz (host only)
 * @param {string} roomId - Room ID
 */
export const endQuiz = (roomId) => {
  if (!socket) return;
  socket.emit('host:end-quiz', { roomId });
};

/**
 * Remove a participant from the quiz (host only)
 * @param {string} roomId - Room ID
 * @param {string} userId - User ID to remove
 */
export const removeParticipant = (roomId, userId) => {
  if (!socket) return;
  socket.emit('host:remove-participant', { roomId, userId });
};

// Helper method to subscribe to multiple events at once
export const subscribeToEvents = (events) => {
  if (!socket) return {};
  
  const unsubscribeFunctions = {};
  
  Object.entries(events).forEach(([event, callback]) => {
    socket.on(event, callback);
    unsubscribeFunctions[event] = () => socket.off(event, callback);
  });
  
  return {
    unsubscribeAll: () => {
      Object.entries(events).forEach(([event, callback]) => {
        socket.off(event, callback);
      });
    },
    ...unsubscribeFunctions
  };
};

export default {
  initializeSocket,
  disconnectSocket,
  joinRoom,
  leaveRoom,
  setReadyStatus,
  submitAnswer,
  startQuiz,
  nextQuestion,
  pauseQuiz,
  resumeQuiz,
  endQuiz,
  removeParticipant,
  subscribeToEvents,
  getSocket: () => socket
}; 