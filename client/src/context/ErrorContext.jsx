import { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'react-toastify';

// Create context
const ErrorContext = createContext(null);

// Debug level constants
export const DEBUG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

// Provider component
export const ErrorProvider = ({ children }) => {
  const [errors, setErrors] = useState([]);
  const [isDebugMode, setIsDebugMode] = useState(
    localStorage.getItem('debugMode') === 'true' || false
  );

  // Toggle debug mode
  const toggleDebugMode = useCallback(() => {
    const newValue = !isDebugMode;
    setIsDebugMode(newValue);
    localStorage.setItem('debugMode', newValue);
  }, [isDebugMode]);

  // Add an error to the error log
  const logError = useCallback((error, source = 'app', showToast = true) => {
    const timestamp = new Date();
    const errorObj = {
      id: Date.now(),
      message: error.message || 'An unknown error occurred',
      stack: error.stack,
      source,
      timestamp,
    };

    // Add to error log
    setErrors(prevErrors => [errorObj, ...prevErrors].slice(0, 100)); // Keep only last 100 errors
    
    // Show toast notification if needed
    if (showToast) {
      toast.error(errorObj.message);
    }

    // Always log to console in debug mode
    if (isDebugMode) {
      console.error(`[${source}] ${error.message}`, error);
    }

    return errorObj.id;
  }, [isDebugMode]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Debug log function
  const debugLog = useCallback((message, data = null, level = DEBUG_LEVELS.INFO, source = 'app') => {
    if (!isDebugMode) return;

    const logMessage = `[${source}] ${message}`;

    switch (level) {
      case DEBUG_LEVELS.ERROR:
        console.error(logMessage, data);
        break;
      case DEBUG_LEVELS.WARN:
        console.warn(logMessage, data);
        break;
      case DEBUG_LEVELS.DEBUG:
        console.debug(logMessage, data);
        break;
      case DEBUG_LEVELS.INFO:
      default:
        console.log(logMessage, data);
        break;
    }
  }, [isDebugMode]);

  // Context value
  const value = {
    errors,
    logError,
    clearErrors,
    isDebugMode,
    toggleDebugMode,
    debugLog,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
};

// Custom hook for using the error context
export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

export default ErrorContext; 