import { DEBUG_LEVELS } from '../context/ErrorContext';

// Default namespace for debug logs if none provided
const DEFAULT_NAMESPACE = 'app';

/**
 * Debug logger factory - creates a logger with a specified namespace
 * @param {string} namespace - The namespace for this logger
 * @returns {Object} - Object with logging methods
 */
export const createLogger = (namespace = DEFAULT_NAMESPACE) => {
  const isDebugMode = () => localStorage.getItem('debugMode') === 'true';

  const commonLog = (level, message, data = null) => {
    if (!isDebugMode()) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}][${namespace}]`;
    
    switch (level) {
      case DEBUG_LEVELS.ERROR:
        console.error(`${prefix} ${message}`, data !== null ? data : '');
        break;
      case DEBUG_LEVELS.WARN:
        console.warn(`${prefix} ${message}`, data !== null ? data : '');
        break;
      case DEBUG_LEVELS.DEBUG:
        console.debug(`${prefix} ${message}`, data !== null ? data : '');
        break;
      case DEBUG_LEVELS.INFO:
      default:
        console.log(`${prefix} ${message}`, data !== null ? data : '');
        break;
    }
  };

  return {
    log: (message, data = null) => commonLog(DEBUG_LEVELS.INFO, message, data),
    info: (message, data = null) => commonLog(DEBUG_LEVELS.INFO, message, data),
    warn: (message, data = null) => commonLog(DEBUG_LEVELS.WARN, message, data),
    error: (message, data = null) => commonLog(DEBUG_LEVELS.ERROR, message, data),
    debug: (message, data = null) => commonLog(DEBUG_LEVELS.DEBUG, message, data),
    
    // Group logs for better organization
    group: (label) => {
      if (!isDebugMode()) return;
      console.group(`[${namespace}] ${label}`);
    },
    groupEnd: () => {
      if (!isDebugMode()) return;
      console.groupEnd();
    },
    
    // Time operations for performance debugging
    time: (label) => {
      if (!isDebugMode()) return;
      console.time(`[${namespace}] ${label}`);
    },
    timeEnd: (label) => {
      if (!isDebugMode()) return;
      console.timeEnd(`[${namespace}] ${label}`);
    },
    
    // Function performance wrapper
    profile: (fn, label = 'Function call') => {
      return (...args) => {
        if (!isDebugMode()) return fn(...args);
        
        const profLabel = `[${namespace}] ${label}`;
        console.time(profLabel);
        try {
          const result = fn(...args);
          if (result instanceof Promise) {
            return result.finally(() => console.timeEnd(profLabel));
          }
          console.timeEnd(profLabel);
          return result;
        } catch (err) {
          console.timeEnd(profLabel);
          throw err;
        }
      };
    }
  };
};

// Create a default logger
const logger = createLogger();

export default logger; 