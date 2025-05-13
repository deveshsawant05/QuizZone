import { apiClient } from './apiClient';

// Static Quiz APIs
export const getCreatedQuizzes = async () => {
  try {
    const response = await apiClient.get('/api/quizzes');
    return response.data.data.quizzes;
  } catch (error) {
    throw error;
  }
};

export const getQuizById = async (quizId) => {
  try {
    const response = await apiClient.get(`/api/quizzes/${quizId}/full`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const createQuiz = async (quizData) => {
  try {
    const response = await apiClient.post('/api/quizzes', quizData);
    return response.data.data.quiz;
  } catch (error) {
    throw error;
  }
};

export const updateQuiz = async (quizId, quizData) => {
  try {
    const response = await apiClient.put(`/api/quizzes/${quizId}`, quizData);
    return response.data.data.quiz;
  } catch (error) {
    throw error;
  }
};

export const deleteQuiz = async (quizId) => {
  try {
    const response = await apiClient.delete(`/api/quizzes/${quizId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const publishQuiz = async (quizId) => {
  try {
    const response = await apiClient.put(`/api/quizzes/${quizId}/publish`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Quiz Questions APIs
export const addQuestionToQuiz = async (quizId, questionData) => {
  try {
    const response = await apiClient.post(`/api/quizzes/${quizId}/questions`, questionData);
    return response.data.data.question;
  } catch (error) {
    throw error;
  }
};

export const updateQuestion = async (quizId, questionId, questionData) => {
  try {
    const response = await apiClient.put(`/api/quizzes/${quizId}/questions/${questionId}`, questionData);
    return response.data.data.question;
  } catch (error) {
    throw error;
  }
};

export const deleteQuestion = async (quizId, questionId) => {
  try {
    const response = await apiClient.delete(`/api/quizzes/${quizId}/questions/${questionId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Quiz Participation APIs
export const getSharedQuiz = async (shareCode) => {
  try {
    const response = await apiClient.get(`/api/quizzes/shared/${shareCode}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const startQuizAttempt = async (quizId) => {
  try {
    const response = await apiClient.post(`/api/quizzes/${quizId}/attempt`);
    return response.data.data.attempt;
  } catch (error) {
    throw error;
  }
};

export const submitQuizAnswers = async (quizId, answerData) => {
  try {
    const response = await apiClient.post(`/api/quizzes/${quizId}/submit`, answerData);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getQuizResults = async (quizId, attemptId) => {
  try {
    const response = await apiClient.get(`/api/quizzes/${quizId}/results?attemptId=${attemptId}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// User Quiz History
export const getRecentAttempts = async () => {
  try {
    const response = await apiClient.get('/api/users/me/attempts');
    return response.data.data.attempts;
  } catch (error) {
    throw error;
  }
};

export const getUserStatistics = async () => {
  try {
    const response = await apiClient.get('/api/users/me/statistics');
    return response.data.data.statistics;
  } catch (error) {
    throw error;
  }
};

// Live Quiz APIs
export const createLiveQuiz = async (quizId) => {
  try {
    const response = await apiClient.post('/api/live-quizzes', { quizId });
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const getLiveQuizDetails = async (roomId) => {
  try {
    const response = await apiClient.get(`/api/live-quizzes/${roomId}`);
    return response.data.data.liveQuiz;
  } catch (error) {
    throw error;
  }
};

export const startLiveQuiz = async (roomId) => {
  try {
    const response = await apiClient.post(`/api/live-quizzes/${roomId}/start`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const nextLiveQuizQuestion = async (roomId) => {
  try {
    const response = await apiClient.post(`/api/live-quizzes/${roomId}/next`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const pauseLiveQuiz = async (roomId) => {
  try {
    const response = await apiClient.post(`/api/live-quizzes/${roomId}/pause`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resumeLiveQuiz = async (roomId) => {
  try {
    const response = await apiClient.post(`/api/live-quizzes/${roomId}/resume`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const endLiveQuiz = async (roomId) => {
  try {
    const response = await apiClient.post(`/api/live-quizzes/${roomId}/end`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getLiveQuizResults = async (roomId) => {
  try {
    const response = await apiClient.get(`/api/live-quizzes/${roomId}/results`);
    return response.data.data.results;
  } catch (error) {
    throw error;
  }
};