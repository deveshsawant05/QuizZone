import axios from 'axios';
import logger, { createLogger } from '../utils/debug';
import { processApiError } from '../utils/errorHandler.jsx';

// Create namespaced logger for API service
const apiLogger = createLogger('api');

// API base URL - adjust this based on your environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

apiLogger.info('API URL configured:', API_URL);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Log outgoing requests in debug mode
    apiLogger.debug(`Request: ${config.method.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    apiLogger.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses in debug mode
    apiLogger.debug(`Response: ${response.status} from ${response.config.url}`, {
      data: response.data,
      headers: response.headers
    });
    
    return response;
  },
  async (error) => {
    // Don't process errors from refresh token or logout endpoints to avoid infinite loops
    const isAuthEndpoint = error.config.url.includes('/auth/refresh-token') || 
                          error.config.url.includes('/auth/logout');
    
    const processedError = processApiError(error);
    
    // Handle token expiration - attempt to refresh token
    if (processedError.statusCode === 401 && !isAuthEndpoint && !error.config._retry) {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        apiLogger.debug('Token expired, attempting refresh...');
        
        // Mark this request as retried
        error.config._retry = true;
        
        try {
          // Call the refresh token endpoint
          const response = await api.post('/auth/refresh-token', { refreshToken });
          
          if (response.data && response.data.data && response.data.data.accessToken) {
            const newAccessToken = response.data.data.accessToken;
            
            // Update tokens in localStorage
            localStorage.setItem('accessToken', newAccessToken);
            
            if (response.data.data.refreshToken) {
              localStorage.setItem('refreshToken', response.data.data.refreshToken);
            }
            
            // Update the Authorization header for the failed request
            error.config.headers['Authorization'] = `Bearer ${newAccessToken}`;
            
            // Retry the original request with the new token
            apiLogger.debug('Token refreshed, retrying original request');
            return api(error.config);
          }
        } catch (refreshError) {
          apiLogger.error('Failed to refresh token', { error: refreshError.message });
          // Continue to auth cleanup
        }
      }
      
      // If refresh failed or no refresh token, clear tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Use a session variable to prevent multiple redirects
      if (!sessionStorage.getItem('redirecting_to_login')) {
        // Only redirect to login if not already on a login/auth page
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/login') && 
            !currentPath.startsWith('/register') &&
            !currentPath.startsWith('/forgot-password') &&
            !currentPath.startsWith('/reset-password')) {
          
          // Set flag to prevent multiple redirects
          sessionStorage.setItem('redirecting_to_login', 'true');
          
          // Use a slight delay to allow other API calls to complete
          setTimeout(() => {
            apiLogger.info('Redirecting to login page after auth failure');
            window.location.href = '/login';
            
            // Remove the flag after redirect
            setTimeout(() => {
              sessionStorage.removeItem('redirecting_to_login');
            }, 1000);
          }, 100);
        }
      } else {
        apiLogger.debug('Redirect to login already in progress, skipping');
      }
    }
    
    return Promise.reject(processedError);
  }
);

// Wrapper function to handle API calls with better error processing
const callApi = async (apiFunction, ...args) => {
  try {
    apiLogger.time(`API call: ${apiFunction.name}`);
    const response = await apiFunction(...args);
    apiLogger.timeEnd(`API call: ${apiFunction.name}`);
    
    // Log the full response for debugging
    apiLogger.debug(`API Response:`, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });
    
    // Check if response data is valid
    if (!response.data) {
      apiLogger.error('API returned empty data');
      throw new Error('Empty response received from server');
    }
    
    // Return the full response data
    return response.data;
  } catch (error) {
    apiLogger.timeEnd(`API call: ${apiFunction.name}`);
    
    // Enhanced error logging
    apiLogger.error(`API Error:`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      stack: error.stack
    });
    
    throw error; // Already processed by response interceptor
  }
};

// AUTH APIs
const auth = {
  register: (userData) => {
    apiLogger.info('Registering new user', { email: userData.email, name: userData.name });
    apiLogger.debug('Registration data', { ...userData, password: '[REDACTED]' });
    
    return callApi(async () => {
      try {
        const response = await api.post('/auth/register', {
          name: userData.name,
          email: userData.email,
          password: userData.password,
          confirmPassword: userData.confirmPassword
        });
        
        apiLogger.info('User registered successfully', { 
          userId: response.data.data?.user?._id, 
          email: userData.email 
        });
        
        return response;
      } catch (error) {
        apiLogger.error('Registration failed', { 
          email: userData.email,
          error: error.message,
          statusCode: error.response?.status,
          errorData: error.response?.data
        });
        throw error;
      }
    });
  },
  
  login: (credentials) => {
    apiLogger.info('User login attempt', { email: credentials.email });
    
    return callApi(async () => {
      try {
        const response = await api.post('/auth/login', {
          email: credentials.email,
          password: credentials.password
        });
        
        // Log the full response structure (without sensitive data)
        apiLogger.debug('Login response structure', {
          status: response.status,
          hasData: !!response.data,
          dataKeys: Object.keys(response.data || {}),
          nestedDataKeys: response.data?.data ? Object.keys(response.data.data) : [],
          hasUser: !!response.data?.data?.user,
          hasAccessToken: !!response.data?.data?.accessToken,
          hasRefreshToken: !!response.data?.data?.refreshToken
        });
        
        // Structure check and validation
        if (!response.data?.data?.accessToken) {
          apiLogger.warn('Missing access token in login response', {
            responseStructure: Object.keys(response.data || {})
          });
        }
        
        apiLogger.info('User logged in successfully', { 
          email: credentials.email,
          userId: response.data?.data?.user?.id || 'unknown'
        });
        
        return response;
      } catch (error) {
        apiLogger.error('Login failed', { 
          email: credentials.email, 
          error: error.message,
          statusCode: error.response?.status,
          errorData: error.response?.data
        });
        throw error;
      }
    });
  },
  
  logout: (refreshToken) => {
    apiLogger.info('User logout attempt');
    
    return callApi(async () => {
      try {
        const response = await api.post('/auth/logout', { refreshToken });
        apiLogger.info('User logged out successfully');
        return response;
      } catch (error) {
        apiLogger.error('Logout error', { 
          error: error.message,
          statusCode: error.response?.status
        });
        throw error;
      }
    });
  },
  
  refreshToken: (refreshToken) => {
    apiLogger.debug('Attempting to refresh access token');
    
    return callApi(async () => {
      try {
        const response = await api.post('/auth/refresh-token', { refreshToken });
        apiLogger.debug('Token refreshed successfully');
        return response;
      } catch (error) {
        apiLogger.error('Token refresh failed', { 
          error: error.message,
          statusCode: error.response?.status
        });
        throw error;
      }
    });
  },
  
  forgotPassword: (email) => {
    apiLogger.info('Password reset requested', { email });
    
    return callApi(async () => {
      try {
        const response = await api.post('/auth/forgot-password', { email });
        apiLogger.info('Password reset email sent', { email });
        return response;
      } catch (error) {
        apiLogger.error('Password reset request failed', { 
          email,
          error: error.message,
          statusCode: error.response?.status
        });
        throw error;
      }
    });
  },
  
  resetPassword: (token, password, confirmPassword) => {
    apiLogger.info('Password reset attempt with token');
    
    return callApi(async () => {
      try {
        const response = await api.post('/auth/reset-password', { 
          token, 
          password, 
          confirmPassword 
        });
        apiLogger.info('Password reset successful');
        return response;
      } catch (error) {
        apiLogger.error('Password reset failed', { 
          error: error.message, 
          statusCode: error.response?.status,
          token: token.substring(0, 4) + '...' // Log only part of token for security
        });
        throw error;
      }
    });
  },
  
  getProfile: () => {
    apiLogger.debug('Verifying user token');
    
    return callApi(async () => {
      try {
        // Try several endpoints to see which one works for token verification
        let response;
        
        // Option 1: Try to use a dedicated token verification endpoint
        try {
          response = await api.get('/auth/verify-token');
          apiLogger.debug('Token verified via /auth/verify-token');
          return response;
        } catch (err1) {
          apiLogger.debug('verify-token endpoint failed', { error: err1.message });
          
          // Option 2: Try using /auth/me endpoint which is common in many APIs
          try {
            response = await api.get('/auth/me');
            apiLogger.debug('Token verified via /auth/me');
            return response;
          } catch (err2) {
            apiLogger.debug('/auth/me endpoint failed', { error: err2.message });
            
            // Option 3: Try using /users/current endpoint which is also common
            try {
              response = await api.get('/users/current');
              apiLogger.debug('Token verified via /users/current');
              return response;
            } catch (err3) {
              apiLogger.debug('/users/current endpoint failed', { error: err3.message });
              
              // Option 4: Try the refresh token endpoint with a GET request to just verify
              try {
                response = await api.get('/auth/refresh-token');
                apiLogger.debug('Token verified via GET /auth/refresh-token');
                return response;
              } catch (err4) {
                apiLogger.debug('All verification endpoints failed');
                // If all checks failed, throw the original error
                throw err1;
              }
            }
          }
        }
      } catch (error) {
        apiLogger.error('Error verifying user token', { 
          error: error.message,
          statusCode: error.response?.status
        });
        throw error;
      }
    });
  },
  
  updateProfile: (profileData) => {
    apiLogger.info('Updating user profile');
    
    return callApi(async () => {
      try {
        const response = await api.put('/auth/profile', profileData);
        apiLogger.info('User profile updated successfully');
        return response;
      } catch (error) {
        apiLogger.error('Profile update failed', { 
          error: error.message,
          statusCode: error.response?.status,
          fields: Object.keys(profileData)
        });
        throw error;
      }
    });
  },
};

// QUIZ APIs
const quizzes = {
  create: (quizData) => callApi(() => api.post('/quizzes', quizData)),
  getAll: (params) => callApi(() => api.get('/quizzes', { params })),
  getById: (quizId) => callApi(() => api.get(`/quizzes/${quizId}`)),
  update: (quizId, quizData) => callApi(() => api.put(`/quizzes/${quizId}`, quizData)),
  delete: (quizId) => callApi(() => api.delete(`/quizzes/${quizId}`)),
  
  // Questions
  addQuestion: (quizId, questionData) => callApi(() => api.post(`/quizzes/${quizId}/questions`, questionData)),
  updateQuestion: (quizId, questionId, questionData) => 
    callApi(() => api.put(`/quizzes/${quizId}/questions/${questionId}`, questionData)),
  deleteQuestion: (quizId, questionId) => callApi(() => api.delete(`/quizzes/${quizId}/questions/${questionId}`)),
  
  // Publishing
  publish: (quizId) => callApi(() => api.post(`/quizzes/${quizId}/publish`)),
  getShared: (shareCode) => callApi(() => api.get(`/quizzes/shared/${shareCode}`)),
  
  // Attempting
  startAttempt: (quizId) => callApi(() => api.post(`/quizzes/${quizId}/attempt`)),
  submitAnswers: (quizId, attemptData) => callApi(() => api.post(`/quizzes/${quizId}/submit`, attemptData)),
  getResults: (quizId, attemptId) => callApi(() => api.get(`/quizzes/${quizId}/results/${attemptId}`)),
};

// LIVE QUIZ APIs
const liveQuizzes = {
  create: (quizData) => callApi(() => api.post('/live-quizzes', quizData)),
  getById: (roomId) => callApi(() => api.get(`/live-quizzes/${roomId}`)),
  getByCode: (roomCode) => callApi(() => api.get(`/live-quizzes/code/${roomCode}`)),
  start: (roomId) => callApi(() => api.post(`/live-quizzes/${roomId}/start`)),
  end: (roomId) => callApi(() => api.post(`/live-quizzes/${roomId}/end`)),
  getResults: (roomId) => callApi(() => api.get(`/live-quizzes/${roomId}/results`)),
};

// USER APIs
const users = {
  getAttempts: (params) => callApi(() => api.get('/users/me/attempts', { params })),
  getStatistics: () => callApi(() => api.get('/users/me/statistics')),
};

// QUESTION BANK APIs
const questionBank = {
  getAll: (params) => callApi(() => api.get('/questions', { params })),
  create: (questionData) => callApi(() => api.post('/questions', questionData)),
  update: (questionId, questionData) => callApi(() => api.put(`/questions/${questionId}`, questionData)),
  delete: (questionId) => callApi(() => api.delete(`/questions/${questionId}`)),
};

export default {
  auth,
  quizzes,
  liveQuizzes,
  users,
  questionBank,
};