import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

/**
 * ErrorToast component - displays error messages in a toast notification
 */
const ErrorToast = ({ 
  message, 
  details = null, 
  onClose, 
  autoCloseDelay = 7000, 
  type = 'error',
  position = 'bottom-right' 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  // Auto close the toast after delay if not zero
  useEffect(() => {
    if (autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, []);

  // Handle closing the toast
  const handleClose = () => {
    setIsVisible(false);
    // Wait for the exit animation to complete
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  // Handle toggling error details
  const toggleDetails = () => {
    setShowDetails(prev => !prev);
  };

  // If not visible, return null
  if (!isVisible) return null;

  // Define CSS classes based on type
  const baseClasses = "fixed shadow-lg rounded-lg p-4 min-w-72 max-w-md z-50 flex flex-col transition-all duration-300";
  const typeClasses = {
    error: "bg-red-50 border border-red-200 text-red-700",
    warning: "bg-yellow-50 border border-yellow-200 text-yellow-700",
    info: "bg-blue-50 border border-blue-200 text-blue-700",
    success: "bg-green-50 border border-green-200 text-green-700"
  };
  
  // Define position classes
  const positionClasses = {
    'top-left': "top-4 left-4",
    'top-right': "top-4 right-4",
    'bottom-left': "bottom-4 left-4",
    'bottom-right': "bottom-4 right-4",
    'top-center': "top-4 left-1/2 transform -translate-x-1/2",
    'bottom-center': "bottom-4 left-1/2 transform -translate-x-1/2"
  };

  // Define icon based on type
  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'success':
        return (
          <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type] || typeClasses.error} ${positionClasses[position] || positionClasses['bottom-right']}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">
            {message}
          </p>
          {details && (
            <button 
              onClick={toggleDetails} 
              className="text-xs underline mt-1 focus:outline-none"
            >
              {showDetails ? 'Hide details' : 'Show details'}
            </button>
          )}
          {showDetails && details && (
            <div className="mt-2">
              <p className="text-xs font-mono bg-white/50 p-2 rounded overflow-auto max-h-32">
                {typeof details === 'object' ? JSON.stringify(details, null, 2) : details}
              </p>
            </div>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            className="inline-flex text-gray-400 focus:outline-none focus:text-gray-500 hover:text-gray-500"
            onClick={handleClose}
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

ErrorToast.propTypes = {
  message: PropTypes.string.isRequired,
  details: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onClose: PropTypes.func,
  autoCloseDelay: PropTypes.number,
  type: PropTypes.oneOf(['error', 'warning', 'info', 'success']),
  position: PropTypes.oneOf(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center'])
};

export default ErrorToast; 