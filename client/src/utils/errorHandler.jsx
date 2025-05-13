import logger from './debug';

/**
 * Process API errors and return a standardized error object
 * @param {Error} error - The error object from API call
 * @returns {Object} Standardized error object with message and details
 */
export const processApiError = (error) => {
  logger.group('API Error');
  logger.error('Original error:', error);

  let errorMessage = 'An unexpected error occurred. Please try again.';
  let statusCode = 500;
  let errorDetails = null;

  // Handle Axios errors
  if (error.response) {
    // Server responded with non-2xx status
    statusCode = error.response.status;
    
    // Try to extract error message from response
    const data = error.response.data;
    
    if (data) {
      if (data.message) {
        errorMessage = data.message;
      } else if (data.error) {
        errorMessage = typeof data.error === 'string' ? data.error : 'Server error';
      }
      
      // Extract validation errors if available
      if (data.errors || data.validationErrors) {
        errorDetails = data.errors || data.validationErrors;
      }
    }
    
    // Set appropriate user-friendly messages based on status code
    switch (statusCode) {
      case 400:
        if (!errorMessage || errorMessage === 'Bad Request') {
          errorMessage = 'Invalid request. Please check your input.';
        }
        break;
      case 401:
        errorMessage = 'Authentication required. Please log in again.';
        break;
      case 403:
        errorMessage = 'You do not have permission to perform this action.';
        break;
      case 404:
        errorMessage = 'The requested resource was not found.';
        break;
      case 422:
        errorMessage = 'Validation failed. Please check your input.';
        break;
      case 429:
        errorMessage = 'Too many requests. Please try again later.';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorMessage = 'Server error. Please try again later.';
        break;
      default:
        // Use the message from the server if available
        break;
    }
  } else if (error.request) {
    // Request was made but no response received
    errorMessage = 'No response from server. Please check your internet connection and try again.';
    statusCode = 0;
  } else {
    // Error in setting up the request
    errorMessage = error.message || 'Error setting up the request. Please try again.';
  }

  logger.error('Processed error:', { message: errorMessage, statusCode, details: errorDetails });
  logger.groupEnd();

  return {
    message: errorMessage,
    statusCode,
    details: errorDetails,
    originalError: error
  };
};

/**
 * Async error handler for React components (HOF)
 * @param {Function} fn - Async function to wrap with error handling
 * @param {Function} onError - Optional error callback
 * @returns {Function} Wrapped function with error handling
 */
export const withErrorHandling = (fn, onError) => {
  return async (...args) => {
    try {
      logger.time(`Function execution: ${fn.name || 'anonymous'}`);
      const result = await fn(...args);
      logger.timeEnd(`Function execution: ${fn.name || 'anonymous'}`);
      return result;
    } catch (error) {
      logger.timeEnd(`Function execution: ${fn.name || 'anonymous'}`);
      logger.error(`Error in function: ${fn.name || 'anonymous'}`, error);
      
      const processedError = processApiError(error);
      
      if (typeof onError === 'function') {
        onError(processedError);
      }
      
      throw processedError;
    }
  };
};

/**
 * Create a component error boundary HOC
 * @param {Function} Component - Component to wrap with error boundary
 * @param {Function} ErrorComponent - Component to render on error
 * @returns {Function} Wrapped component with error boundary
 */
export const withErrorBoundary = (Component, ErrorComponent) => {
  return function ErrorBoundaryWrapper(props) {
    try {
      return <Component {...props} />;
    } catch (error) {
      logger.error('Component error:', error);
      return ErrorComponent ? <ErrorComponent error={error} /> : <div>Something went wrong</div>;
    }
  };
};

export default {
  processApiError,
  withErrorHandling,
  withErrorBoundary
}; 