import axios from 'axios';

// Create an axios instance with default config
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and handle logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making request to ${config.url} [${config.method}]`);

    // Add token to request header if it exists 
    const token = localStorage.getItem('accessToken');
    if (token) {
      console.log('Adding token to request headers');
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log the request for debugging purposes
    const logData = {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      data: config.data ? Object.keys(config.data) : 'none',
      query: config.params ? Object.keys(config.params) : 'none'
    };
    
    console.log('API Request:', logData);
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in debug mode
    console.log(`Response: ${response.status} from ${response.config.url}`, {
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
    if (processedError.status === 401 && !isAuthEndpoint && !error.config._retry) {
      console.log('Attempting to refresh access token due to 401 response');
      
      try {
        error.config._retry = true;
        
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Call refresh token API
        const response = await apiClient.post('/auth/refresh-token', { refreshToken });
        
        // Extract the new access token based on the server's response structure
        let newAccessToken = null;
        
        if (response.data?.data?.accessToken) {
          // Structure: { data: { accessToken: '...' } }
          newAccessToken = response.data.data.accessToken;
        } else if (response.data?.accessToken) {
          // Structure: { accessToken: '...' }
          newAccessToken = response.data.accessToken;
        }
        
        if (!newAccessToken) {
          throw new Error('Invalid token refresh response structure');
        }
        
        console.log('Token refreshed successfully');
        
        // Update token in localStorage and authorization header
        localStorage.setItem('accessToken', newAccessToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        
        // Retry the original request with new token
        error.config.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return apiClient(error.config);
      } catch (refreshError) {
        console.error('Token refresh failed', { error: refreshError.message });
        
        // If refresh fails, log the user out
        const redirectToLoginOnce = () => {
          // Prevent multiple redirects by setting a session flag
          if (!sessionStorage.getItem('redirectingToLogin')) {
            sessionStorage.setItem('redirectingToLogin', 'true');
            
            // Clear auth data
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            
            // Wait a bit for any pending operations
            setTimeout(() => {
              sessionStorage.removeItem('redirectingToLogin');
              window.location.href = '/login';
            }, 300);
          }
        };
        
        // Only redirect if we're not already on a login-related page
        if (!window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/register') &&
            !window.location.pathname.includes('/forgot-password')) {
          redirectToLoginOnce();
        }
      }
    }
    
    return Promise.reject(processedError);
  }
);

/**
 * Process API errors into a consistent format
 * @param {Error} error - The error object from axios
 * @returns {Object} - Standardized error object
 */
const processApiError = (error) => {
  // Log the error details for debugging
  console.error('API Error:', {
    message: error.message,
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    url: error.config?.url
  });
  
  // Create a standardized error response
  return {
    status: error.response?.status || 500,
    message: error.response?.data?.message || error.message || 'Something went wrong',
    data: error.response?.data?.data || {},
    errors: error.response?.data?.errors || {},
    originalError: error
  };
};

export default apiClient; 