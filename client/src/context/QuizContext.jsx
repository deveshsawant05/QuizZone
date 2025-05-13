import React, { createContext, useContext, useState, useReducer } from 'react';
import { getQuizById, createQuiz, updateQuiz, publishQuiz, addQuestionToQuiz, updateQuestion, deleteQuestion } from '../services/quizService';

// Create the context
const QuizContext = createContext(null);

// Initial state
const initialState = {
  currentQuiz: null,
  questions: [],
  isEditing: false,
  isSaving: false,
  isPublishing: false,
  currentStep: 0,
  error: null,
  isLoading: false,
};

// Actions
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_QUIZ: 'SET_QUIZ',
  UPDATE_QUIZ: 'UPDATE_QUIZ',
  SET_QUESTIONS: 'SET_QUESTIONS',
  ADD_QUESTION: 'ADD_QUESTION',
  UPDATE_QUESTION: 'UPDATE_QUESTION',
  REMOVE_QUESTION: 'REMOVE_QUESTION',
  SET_EDITING: 'SET_EDITING',
  SET_SAVING: 'SET_SAVING',
  SET_PUBLISHING: 'SET_PUBLISHING',
  SET_STEP: 'SET_STEP',
  SET_ERROR: 'SET_ERROR',
  RESET_STATE: 'RESET_STATE',
};

// Reducer function
function quizReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ACTIONS.SET_QUIZ:
      return { ...state, currentQuiz: action.payload };
    case ACTIONS.UPDATE_QUIZ:
      return { ...state, currentQuiz: { ...state.currentQuiz, ...action.payload } };
    case ACTIONS.SET_QUESTIONS:
      return { ...state, questions: action.payload };
    case ACTIONS.ADD_QUESTION:
      return { ...state, questions: [...state.questions, action.payload] };
    case ACTIONS.UPDATE_QUESTION:
      return {
        ...state,
        questions: state.questions.map((q) =>
          q._id === action.payload._id ? action.payload : q
        ),
      };
    case ACTIONS.REMOVE_QUESTION:
      return {
        ...state,
        questions: state.questions.filter((q) => q._id !== action.payload),
      };
    case ACTIONS.SET_EDITING:
      return { ...state, isEditing: action.payload };
    case ACTIONS.SET_SAVING:
      return { ...state, isSaving: action.payload };
    case ACTIONS.SET_PUBLISHING:
      return { ...state, isPublishing: action.payload };
    case ACTIONS.SET_STEP:
      return { ...state, currentStep: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case ACTIONS.RESET_STATE:
      return initialState;
    default:
      return state;
  }
}

// Provider component
export const QuizProvider = ({ children }) => {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  const [fetchingQuizIds, setFetchingQuizIds] = useState(new Set());

  // Fetch a quiz by ID
  const fetchQuiz = async (quizId) => {
    // Return early if we already have this quiz and it's not stale
    if (state.currentQuiz && state.currentQuiz._id === quizId) {
      return state.currentQuiz;
    }
    
    // Return early if we're already fetching this quiz
    if (fetchingQuizIds.has(quizId)) {
      return null;
    }
    
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
      
      // Mark this quiz as being fetched
      setFetchingQuizIds(prev => new Set(prev).add(quizId));
      
      const data = await getQuizById(quizId);
      
      // Extract quiz and questions from the response
      const { quiz, questions } = data;
      
      dispatch({ type: ACTIONS.SET_QUIZ, payload: quiz });
      dispatch({ type: ACTIONS.SET_QUESTIONS, payload: questions || [] });
      
      return quiz;
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      
      // After a short delay, remove this quiz from the fetching set
      setTimeout(() => {
        setFetchingQuizIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(quizId);
          return newSet;
        });
      }, 2000); // 2 second cooldown before allowing a re-fetch
    }
  };

  // Create a new quiz
  const createNewQuiz = async (quizData) => {
    try {
      dispatch({ type: ACTIONS.SET_SAVING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
      
      const newQuiz = await createQuiz(quizData);
      
      dispatch({ type: ACTIONS.SET_QUIZ, payload: newQuiz });
      dispatch({ type: ACTIONS.SET_QUESTIONS, payload: [] });
      
      return newQuiz;
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_SAVING, payload: false });
    }
  };

  // Update an existing quiz
  const updateExistingQuiz = async (quizId, quizData) => {
    try {
      dispatch({ type: ACTIONS.SET_SAVING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
      
      const updatedQuiz = await updateQuiz(quizId, quizData);
      
      dispatch({ type: ACTIONS.SET_QUIZ, payload: updatedQuiz });
      
      return updatedQuiz;
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_SAVING, payload: false });
    }
  };

  // Add a question to the quiz
  const addQuestion = async (quizId, questionData) => {
    try {
      dispatch({ type: ACTIONS.SET_SAVING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
      
      const newQuestion = await addQuestionToQuiz(quizId, questionData);
      
      dispatch({ type: ACTIONS.ADD_QUESTION, payload: newQuestion });
      
      return newQuestion;
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_SAVING, payload: false });
    }
  };

  // Update an existing question
  const updateExistingQuestion = async (quizId, questionId, questionData) => {
    try {
      dispatch({ type: ACTIONS.SET_SAVING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
      
      const updatedQuestion = await updateQuestion(quizId, questionId, questionData);
      
      dispatch({ type: ACTIONS.UPDATE_QUESTION, payload: updatedQuestion });
      
      return updatedQuestion;
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_SAVING, payload: false });
    }
  };

  // Remove a question from the quiz
  const removeQuestion = async (quizId, questionId) => {
    try {
      dispatch({ type: ACTIONS.SET_SAVING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
      
      await deleteQuestion(quizId, questionId);
      
      dispatch({ type: ACTIONS.REMOVE_QUESTION, payload: questionId });
      
      return true;
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_SAVING, payload: false });
    }
  };

  // Publish the quiz
  const publishExistingQuiz = async (quizId) => {
    try {
      dispatch({ type: ACTIONS.SET_PUBLISHING, payload: true });
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
      
      const publishResult = await publishQuiz(quizId);
      
      // Extract share code from the response
      const shareCode = publishResult.shareCode || (publishResult.quiz && publishResult.quiz.shareCode);
      
      dispatch({
        type: ACTIONS.UPDATE_QUIZ,
        payload: { 
          isPublished: true,
          shareCode
        }
      });
      
      return { shareCode };
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: ACTIONS.SET_PUBLISHING, payload: false });
    }
  };

  // Set the current step in multi-step quiz creation
  const setStep = (step) => {
    dispatch({ type: ACTIONS.SET_STEP, payload: step });
  };

  // Reset the quiz state
  const resetQuizState = () => {
    dispatch({ type: ACTIONS.RESET_STATE });
  };

  // Context value
  const value = {
    ...state,
    fetchQuiz,
    createQuiz: createNewQuiz,
    updateQuiz: updateExistingQuiz,
    addQuestion,
    updateQuestion: updateExistingQuestion,
    removeQuestion,
    publishQuiz: publishExistingQuiz,
    setStep,
    resetQuizState,
    setEditMode: (isEditing) => dispatch({ 
      type: ACTIONS.SET_EDITING, 
      payload: isEditing 
    }),
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
};

// Custom hook to use the quiz context
export const useQuiz = () => {
  const context = useContext(QuizContext);
  
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  
  return context;
}; 