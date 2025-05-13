import React, { createContext, useContext, useReducer, useRef, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import {
  createLiveQuiz,
  getLiveQuizDetails,
  startLiveQuiz,
  nextLiveQuizQuestion,
  pauseLiveQuiz,
  resumeLiveQuiz,
  endLiveQuiz,
  getLiveQuizResults
} from '../services/quizService';

// Create context
const LiveQuizContext = createContext(null);

// Initial state
const initialState = {
  roomId: null,
  roomCode: null,
  status: 'idle', // idle, waiting, active, paused, ended
  isHost: false,
  quizData: null,
  participants: [],
  currentQuestion: null,
  currentQuestionIndex: 0,
  timer: null,
  timerDuration: 0,
  userAnswer: null,
  leaderboard: [],
  results: null,
  error: null,
  loading: false,
  connected: false,
  submitting: false,
};

// Action types
const ACTIONS = {
  SET_ROOM: 'SET_ROOM',
  SET_STATUS: 'SET_STATUS',
  SET_QUIZ_DATA: 'SET_QUIZ_DATA',
  SET_PARTICIPANTS: 'SET_PARTICIPANTS',
  ADD_PARTICIPANT: 'ADD_PARTICIPANT',
  REMOVE_PARTICIPANT: 'REMOVE_PARTICIPANT',
  SET_CURRENT_QUESTION: 'SET_CURRENT_QUESTION',
  SET_TIMER: 'SET_TIMER',
  SET_USER_ANSWER: 'SET_USER_ANSWER',
  SET_LEADERBOARD: 'SET_LEADERBOARD',
  SET_RESULTS: 'SET_RESULTS',
  SET_ERROR: 'SET_ERROR',
  SET_LOADING: 'SET_LOADING',
  SET_CONNECTED: 'SET_CONNECTED',
  SET_SUBMITTING: 'SET_SUBMITTING',
  RESET_STATE: 'RESET_STATE',
};

// Reducer function
const liveQuizReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_ROOM:
      return {
        ...state,
        roomId: action.payload.roomId,
        roomCode: action.payload.roomCode,
        isHost: action.payload.isHost || false,
      };
    case ACTIONS.SET_STATUS:
      return { ...state, status: action.payload };
    case ACTIONS.SET_QUIZ_DATA:
      return { ...state, quizData: action.payload };
    case ACTIONS.SET_PARTICIPANTS:
      return { ...state, participants: action.payload };
    case ACTIONS.ADD_PARTICIPANT:
      return {
        ...state,
        participants: [...state.participants, action.payload],
      };
    case ACTIONS.REMOVE_PARTICIPANT:
      return {
        ...state,
        participants: state.participants.filter(
          (p) => p.userId !== action.payload
        ),
      };
    case ACTIONS.SET_CURRENT_QUESTION:
      return {
        ...state,
        currentQuestion: action.payload.question,
        currentQuestionIndex: action.payload.index,
        userAnswer: null, // Reset user answer for new question
      };
    case ACTIONS.SET_TIMER:
      return { ...state, timer: action.payload };
    case ACTIONS.SET_USER_ANSWER:
      return { ...state, userAnswer: action.payload };
    case ACTIONS.SET_LEADERBOARD:
      return { ...state, leaderboard: action.payload };
    case ACTIONS.SET_RESULTS:
      return { ...state, results: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_CONNECTED:
      return { ...state, connected: action.payload };
    case ACTIONS.SET_SUBMITTING:
      return { ...state, submitting: action.payload };
    case ACTIONS.RESET_STATE:
      return { ...initialState };
    default:
      return state;
  }
};

// Provider component
export const LiveQuizProvider = ({ children }) => {
  const [state, dispatch] = useReducer(liveQuizReducer, initialState);
  const { user } = useAuth();
  const socketRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Connect to the WebSocket server
  const connectSocket = useCallback(() => {
    if (socketRef.current) {
      return;
    }

    // Initialize socket connection
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    socketRef.current = io(socketUrl, {
      auth: {
        token: localStorage.getItem('accessToken'),
      },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Setup socket event handlers
    socketRef.current.on('connect', () => {
      dispatch({ type: ACTIONS.SET_CONNECTED, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
    });

    socketRef.current.on('disconnect', () => {
      dispatch({ type: ACTIONS.SET_CONNECTED, payload: false });
    });

    socketRef.current.on('connect_error', (error) => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: 'Connection error: ' + error.message });
      dispatch({ type: ACTIONS.SET_CONNECTED, payload: false });
    });

    // Quiz events
    socketRef.current.on('quiz:start', () => {
      dispatch({ type: ACTIONS.SET_STATUS, payload: 'active' });
    });

    socketRef.current.on('quiz:question', (data) => {
      dispatch({
        type: ACTIONS.SET_CURRENT_QUESTION,
        payload: {
          question: data.question,
          index: data.questionIndex,
        },
      });
      // Reset timer for new question
      if (data.timeLimit) {
        startTimer(data.timeLimit);
      }
    });

    socketRef.current.on('quiz:timer', (data) => {
      dispatch({ type: ACTIONS.SET_TIMER, payload: data.remainingTime });
    });

    socketRef.current.on('quiz:question:end', () => {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
      dispatch({ type: ACTIONS.SET_TIMER, payload: 0 });
    });

    socketRef.current.on('quiz:leaderboard', (data) => {
      dispatch({ type: ACTIONS.SET_LEADERBOARD, payload: data.leaderboard });
    });

    socketRef.current.on('quiz:end', (data) => {
      dispatch({ type: ACTIONS.SET_STATUS, payload: 'ended' });
      dispatch({ type: ACTIONS.SET_RESULTS, payload: data.results });
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    });

    // Participant events
    socketRef.current.on('user:joined', (data) => {
      dispatch({ type: ACTIONS.ADD_PARTICIPANT, payload: data.participant });
    });

    socketRef.current.on('user:left', (data) => {
      dispatch({ type: ACTIONS.REMOVE_PARTICIPANT, payload: data.userId });
    });

    // Host messages
    socketRef.current.on('host:message', (data) => {
      console.log('Host message:', data.message);
    });

    // Error events
    socketRef.current.on('error', (data) => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: data.message });
    });

    // Connect to the socket server
    socketRef.current.connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Disconnect from the socket server
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      dispatch({ type: ACTIONS.SET_CONNECTED, payload: false });
    }
  }, []);

  // Create a live quiz from an existing quiz
  const createLiveQuizRoom = async (quizId) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });

      const data = await createLiveQuiz(quizId);
      
      dispatch({
        type: ACTIONS.SET_ROOM,
        payload: {
          roomId: data.liveQuiz._id,
          roomCode: data.liveQuiz.roomCode,
          isHost: true,
        },
      });
      
      dispatch({ type: ACTIONS.SET_QUIZ_DATA, payload: data.liveQuiz });
      dispatch({ type: ACTIONS.SET_STATUS, payload: 'waiting' });
      
      // Connect to socket server
      connectSocket();
      
      // Join the room as host
      if (socketRef.current) {
        socketRef.current.emit('join:room', {
          roomId: data.liveQuiz._id,
          isHost: true,
        });
      }
      
      return data.liveQuiz;
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Join an existing live quiz as a participant
  const joinLiveQuiz = async (roomCode) => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });

      // Validate room code and get quiz details
      const liveQuiz = await getLiveQuizDetails(roomCode);
      
      dispatch({
        type: ACTIONS.SET_ROOM,
        payload: {
          roomId: liveQuiz._id,
          roomCode: liveQuiz.roomCode,
          isHost: false,
        },
      });
      
      dispatch({ type: ACTIONS.SET_QUIZ_DATA, payload: liveQuiz });
      dispatch({ type: ACTIONS.SET_STATUS, payload: liveQuiz.status });
      dispatch({ type: ACTIONS.SET_PARTICIPANTS, payload: liveQuiz.participants || [] });
      
      // Connect to socket server
      connectSocket();
      
      // Join the room as participant
      if (socketRef.current) {
        socketRef.current.emit('join:room', {
          roomId: liveQuiz._id,
          isHost: false,
        });
      }
      
      return liveQuiz;
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Start the live quiz (host only)
  const startQuiz = async () => {
    try {
      if (!state.isHost || !state.roomId) {
        throw new Error('Only the host can start the quiz');
      }
      
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
      
      await startLiveQuiz(state.roomId);
      
      // The status will be updated via WebSocket
      if (socketRef.current) {
        socketRef.current.emit('host:start-quiz', { roomId: state.roomId });
      }
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Move to the next question (host only)
  const nextQuestion = async () => {
    try {
      if (!state.isHost || !state.roomId) {
        throw new Error('Only the host can navigate questions');
      }
      
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
      
      await nextLiveQuizQuestion(state.roomId);
      
      // The next question will be sent via WebSocket
      if (socketRef.current) {
        socketRef.current.emit('host:next-question', { roomId: state.roomId });
      }
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Pause the live quiz (host only)
  const pauseQuiz = async () => {
    try {
      if (!state.isHost || !state.roomId) {
        throw new Error('Only the host can pause the quiz');
      }
      
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
      
      await pauseLiveQuiz(state.roomId);
      
      dispatch({ type: ACTIONS.SET_STATUS, payload: 'paused' });
      
      if (socketRef.current) {
        socketRef.current.emit('host:pause-quiz', { roomId: state.roomId });
      }
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Resume the live quiz (host only)
  const resumeQuiz = async () => {
    try {
      if (!state.isHost || !state.roomId) {
        throw new Error('Only the host can resume the quiz');
      }
      
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
      
      await resumeLiveQuiz(state.roomId);
      
      dispatch({ type: ACTIONS.SET_STATUS, payload: 'active' });
      
      if (socketRef.current) {
        socketRef.current.emit('host:resume-quiz', { roomId: state.roomId });
      }
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  // End the live quiz (host only)
  const endQuiz = async () => {
    try {
      if (!state.isHost || !state.roomId) {
        throw new Error('Only the host can end the quiz');
      }
      
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
      
      await endLiveQuiz(state.roomId);
      
      // The quiz end will be broadcast via WebSocket
      if (socketRef.current) {
        socketRef.current.emit('host:end-quiz', { roomId: state.roomId });
      }
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Submit an answer to the current question
  const submitAnswer = (answer) => {
    try {
      if (!state.roomId || !state.currentQuestion) {
        throw new Error('No active question to answer');
      }
      
      dispatch({ type: ACTIONS.SET_SUBMITTING, payload: true });
      dispatch({ type: ACTIONS.SET_USER_ANSWER, payload: answer });
      
      if (socketRef.current) {
        socketRef.current.emit('submit:answer', {
          roomId: state.roomId,
          questionId: state.currentQuestion._id,
          answer: answer
        });
      }
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_SUBMITTING, payload: false });
    }
  };

  // Get quiz results
  const getResults = async () => {
    try {
      if (!state.roomId) {
        throw new Error('No active quiz to get results for');
      }
      
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
      
      const results = await getLiveQuizResults(state.roomId);
      dispatch({ type: ACTIONS.SET_RESULTS, payload: results });
      
      return results;
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Start a timer for the current question
  const startTimer = (duration) => {
    dispatch({ type: ACTIONS.SET_TIMER, payload: duration });
    
    // Clear any existing interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    // Set up a new interval
    let timeRemaining = duration;
    timerIntervalRef.current = setInterval(() => {
      timeRemaining -= 1;
      dispatch({ type: ACTIONS.SET_TIMER, payload: timeRemaining });
      
      if (timeRemaining <= 0) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }, 1000);
  };

  // Leave the current quiz room
  const leaveRoom = () => {
    if (socketRef.current && state.roomId) {
      socketRef.current.emit('leave:room', { roomId: state.roomId });
    }
    
    disconnectSocket();
    dispatch({ type: ACTIONS.RESET_STATE });
    
    // Clear any active timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      disconnectSocket();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [disconnectSocket]);

  // Context value
  const value = {
    ...state,
    createLiveQuiz: createLiveQuizRoom,
    joinLiveQuiz,
    startQuiz,
    nextQuestion,
    pauseQuiz,
    resumeQuiz,
    endQuiz,
    submitAnswer,
    getResults,
    leaveRoom,
  };

  return <LiveQuizContext.Provider value={value}>{children}</LiveQuizContext.Provider>;
};

// Custom hook to use the live quiz context
export const useLiveQuiz = () => {
  const context = useContext(LiveQuizContext);
  
  if (!context) {
    throw new Error('useLiveQuiz must be used within a LiveQuizProvider');
  }
  
  return context;
}; 