import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import api from '../services/api';
import { createLogger } from '../utils/debug';
import { withErrorHandling } from '../utils/errorHandler';

// Create a dedicated logger for auth
const authLogger = createLogger('auth');

// Create context
const AuthContext = createContext(null);

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isInitialized: false
  });

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      authLogger.info('Initializing authentication state');
      try {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (accessToken) {
          authLogger.debug('Access token found, verifying...', { tokenStart: accessToken.substring(0, 10) + '...' });
          
          // Function to decode JWT token
          const decodeToken = (token) => {
            try {
              const base64Url = token.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(
                atob(base64).split('').map(c => {
                  return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join('')
              );
              return JSON.parse(jsonPayload);
            } catch (err) {
              authLogger.warn('Failed to decode token', { error: err.message });
              return null;
            }
          };
          
          // Try to decode the token as a fallback
          const decodedToken = decodeToken(accessToken);
          
          if (decodedToken) {
            authLogger.debug('Successfully decoded the token', { 
              tokenData: { 
                exp: decodedToken.exp, 
                iat: decodedToken.iat,
                userIdField: decodedToken.id || decodedToken.sub || decodedToken._id || 'not-found' 
              } 
            });
            
            // Check if token is expired
            const currentTime = Math.floor(Date.now() / 1000);
            if (decodedToken.exp && decodedToken.exp < currentTime) {
              authLogger.warn('Token is expired according to payload', { 
                expiry: new Date(decodedToken.exp * 1000).toISOString(),
                current: new Date(currentTime * 1000).toISOString()
              });
              throw new Error('Token expired');
            }
          }
          
          let userData = null;
          
          try {
            // Try to get user info from API if available
            const response = await api.auth.getProfile();
            if (response.data?.user) {
              userData = response.data.user;
            } else if (response.data) {
              userData = response.data;
            }
            authLogger.debug('Profile response received', { 
              hasData: !!response.data,
              hasUser: !!userData 
            });
          } catch (profileError) {
            authLogger.warn('Profile API call failed, using decoded token as fallback', { 
              error: profileError.message
            });
            
            // If API call fails, use the decoded token as user info
            if (decodedToken) {
              // Extract user info from token payload
              userData = {
                id: decodedToken.id || decodedToken.sub || decodedToken._id,
                name: decodedToken.name || 'User',
                email: decodedToken.email || '',
                role: decodedToken.role || 'user'
              };
              
              authLogger.debug('Created user object from token', { userData });
            } else {
              // If we can't decode the token either, create minimal user info
              authLogger.warn('Unable to decode token, creating minimal user info');
              userData = {
                id: 'user-' + Math.random().toString(36).substring(2, 9),
                name: 'User',
                email: '',
                role: 'user'
              };
            }
          }
          
          if (userData) {
            // Normalize the user data
            userData = normalizeUserData(userData);
            
            authLogger.info('Authentication successful');
            setUser(userData);
            setAuthState({
              isAuthenticated: true,
              isInitialized: true
            });
          } else {
            throw new Error('No user data available');
          }
        } else {
          authLogger.debug('No access token found, user is not authenticated');
          setAuthState({
            isAuthenticated: false,
            isInitialized: true
          });
        }
      } catch (error) {
        authLogger.error('Authentication error', { error: error.message });
        
        // Clear tokens if unauthorized
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        setUser(null);
        setAuthState({
          isAuthenticated: false,
          isInitialized: true
        });
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Register a new user
  const register = withErrorHandling(async (userData) => {
    authLogger.info('Registration attempt', { email: userData.email });
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.auth.register(userData);
      
      if (response.success) {
        const newUser = response.data?.user || {};
        const accessToken = response.data?.accessToken;
        const refreshToken = response.data?.refreshToken;
        
        authLogger.info('Registration successful', { userId: newUser?.id });
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken || '');
        
        setUser(newUser);
        setAuthState({
          isAuthenticated: true,
          isInitialized: true
        });
        
        return newUser;
      } else {
        authLogger.warn('Registration response indicated failure', { message: response.message });
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      authLogger.error('Registration failed', { 
        error: error.message,
        email: userData.email,
        errors: error.errors || {}
      });
      setError(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  });

  // Login a user
  const login = withErrorHandling(async (credentials) => {
    authLogger.info('Login attempt', { email: credentials.email });
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.auth.login(credentials);
      
      // The response structure seems to have data nested under response.data
      const responseData = response.data || {};
      
      if (response.success || responseData.success) {
        // Get user data from response - handle potentially nested structure
        let userData = null;
        let accessToken = null;
        let refreshToken = null;
        
        // Check various possible response structures
        if (responseData.user) {
          // Structure: { user: {...}, accessToken: '...', refreshToken: '...' }
          userData = responseData.user;
          accessToken = responseData.accessToken;
          refreshToken = responseData.refreshToken;
        } else if (responseData.data && responseData.data.user) {
          // Structure: { data: { user: {...}, accessToken: '...', refreshToken: '...' } }
          userData = responseData.data.user;
          accessToken = responseData.data.accessToken;
          refreshToken = responseData.data.refreshToken;
        } else if (responseData.data) {
          // Structure: { data: { ... } } with user data directly in data
          userData = responseData.data;
          // Check if tokens are at the root level or in data
          accessToken = responseData.accessToken || responseData.data.accessToken;
          refreshToken = responseData.refreshToken || responseData.data.refreshToken;
        } else {
          // Fallback to root level response
          userData = responseData;
          accessToken = response.accessToken;
          refreshToken = response.refreshToken;
        }
        
        // Log the structure to help debugging
        authLogger.debug('Login response structure', { 
          hasUser: !!userData,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          responseDataKeys: Object.keys(responseData),
          userData: userData ? Object.keys(userData) : 'null'
        });
        
        // Make sure we have the tokens before proceeding
        if (!accessToken) {
          authLogger.error('Missing access token in login response', { 
            responseStructure: JSON.stringify(responseData, null, 2)
          });
          throw new Error('Authentication failed: Invalid server response - missing access token');
        }
        
        authLogger.info('Login successful', { userId: userData?.id || userData?._id || 'unknown' });
        
        // Store the tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken || '');
        
        // Ensure the user has at least a minimal structure
        if (!userData || !Object.keys(userData).length) {
          authLogger.warn('Empty user data in login response, creating minimal user object');
          userData = {
            id: 'unknown',
            name: 'User',
            email: credentials.email
          };
        }
        
        // Normalize the user data
        userData = normalizeUserData(userData);
        
        setUser(userData);
        setAuthState({
          isAuthenticated: true,
          isInitialized: true
        });
        
        return userData;
      } else {
        authLogger.warn('Login response indicated failure', { message: response.message || responseData.message });
        throw new Error(response.message || responseData.message || 'Login failed');
      }
    } catch (error) {
      authLogger.error('Login failed', { 
        error: error.message,
        email: credentials.email,
        errors: error.errors || {}
      });
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  });

  // Logout the current user
  const logout = withErrorHandling(async () => {
    authLogger.info('Logout attempt');
    setLoading(true);
    
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        await api.auth.logout(refreshToken);
        authLogger.info('Logout API call successful');
      } else {
        authLogger.warn('No refresh token found during logout');
      }
    } catch (error) {
      authLogger.error('Error during logout API call', { error: error.message });
      // Continue with logout regardless of API error
    } finally {
      authLogger.info('Clearing auth state and tokens');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setAuthState({
        isAuthenticated: false,
        isInitialized: true
      });
      setLoading(false);
    }
  });

  // Forgot password
  const forgotPassword = withErrorHandling(async (email) => {
    authLogger.info('Forgot password request', { email });
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.auth.forgotPassword(email);
      authLogger.info('Forgot password request successful', { email });
      return response;
    } catch (error) {
      authLogger.error('Forgot password request failed', { 
        email, 
        error: error.message 
      });
      setError(error.message || 'Failed to send password reset link');
      throw error;
    } finally {
      setLoading(false);
    }
  });

  // Reset password
  const resetPassword = withErrorHandling(async (token, password, confirmPassword) => {
    authLogger.info('Password reset attempt');
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.auth.resetPassword(token, password, confirmPassword);
      authLogger.info('Password reset successful');
      return response;
    } catch (error) {
      authLogger.error('Password reset failed', { 
        error: error.message,
        errors: error.errors || {} 
      });
      setError(error.message || 'Failed to reset password');
      throw error;
    } finally {
      setLoading(false);
    }
  });

  // Update user profile
  const updateProfile = withErrorHandling(async (profileData) => {
    authLogger.info('Profile update attempt', { fields: Object.keys(profileData) });
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.auth.updateProfile(profileData);
      
      if (response.success) {
        const updatedUser = response.data.user;
        authLogger.info('Profile update successful', { userId: updatedUser?._id });
        setUser(updatedUser);
        return updatedUser;
      } else {
        authLogger.warn('Profile update response indicated failure', { message: response.message });
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      authLogger.error('Profile update failed', { 
        error: error.message,
        errors: error.errors || {}
      });
      setError(error.message || 'Failed to update profile');
      throw error;
    } finally {
      setLoading(false);
    }
  });

  // Normalize user data to ensure consistent field names
  const normalizeUserData = (userData) => {
    if (!userData) return null;
    
    // Make sure we have both id and _id available
    const normalized = { ...userData };
    
    if (normalized._id && !normalized.id) {
      normalized.id = normalized._id;
    } else if (normalized.id && !normalized._id) {
      normalized._id = normalized.id;
    }
    
    // Ensure other critical fields have at least default values
    normalized.name = normalized.name || 'User';
    normalized.email = normalized.email || '';
    normalized.role = normalized.role || 'user';
    
    return normalized;
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    isAuthenticated: authState.isAuthenticated,
    isInitialized: authState.isInitialized,
    // Debug helpers
    DEBUG_enableDebugMode: () => {
      authLogger.info('Debug mode enabled by user');
      localStorage.setItem('debugMode', 'true');
      window.location.reload();
    },
    DEBUG_disableDebugMode: () => {
      authLogger.info('Debug mode disabled by user');
      localStorage.setItem('debugMode', 'false');
      window.location.reload();
    },
    DEBUG_checkAuth: async () => {
      authLogger.info('Manual auth check requested');
      try {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        
        console.log('=== AUTH DEBUG INFO ===');
        console.log(`Access Token: ${accessToken ? 'Present' : 'Missing'}`);
        console.log(`Refresh Token: ${refreshToken ? 'Present' : 'Missing'}`);
        console.log(`Current Auth State: ${authState.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}`);
        console.log(`Auth Initialized: ${authState.isInitialized ? 'Yes' : 'No'}`);
        console.log(`User Object: ${user ? JSON.stringify(user) : 'None'}`);
        
        if (accessToken) {
          try {
            console.log('Trying to access protected endpoint...');
            const response = await api.users.getStatistics();
            console.log('Protected endpoint accessible', response);
            console.log('AUTH IS WORKING');
          } catch (error) {
            console.log('Protected endpoint error', error);
            console.log('AUTH IS NOT WORKING');
          }
        }
        
        return {
          accessToken: !!accessToken,
          refreshToken: !!refreshToken,
          authState,
          user
        };
      } catch (error) {
        console.error('Auth debug error', error);
        return { error: error.message };
      }
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 