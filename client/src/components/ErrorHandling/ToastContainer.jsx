import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import ErrorToast from './ErrorToast';

// Create context for toast management
export const ToastContext = createContext(null);

/**
 * ToastContainer component - manages toast notifications
 */
export const ToastContainer = ({ position = 'bottom-right', autoCloseDelay = 5000 }) => {
  const [toasts, setToasts] = useState([]);
  
  // Remove a toast by ID
  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  // Create portal for toast container
  return createPortal(
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map(toast => (
        <ErrorToast
          key={toast.id}
          message={toast.message}
          details={toast.details}
          type={toast.type}
          position={position}
          autoCloseDelay={autoCloseDelay}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>,
    document.body
  );
};

ToastContainer.propTypes = {
  position: PropTypes.oneOf(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center']),
  autoCloseDelay: PropTypes.number
};

/**
 * ToastProvider component - provides toast management context
 */
export const ToastProvider = ({ children, ...containerProps }) => {
  const [toasts, setToasts] = useState([]);
  
  // Add a new toast
  const addToast = useCallback(({ message, details, type = 'error' }) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, details, type }]);
    return id;
  }, []);
  
  // Remove a toast by ID
  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);
  
  // Clear all toasts
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);
  
  // Convenience methods for different toast types
  const showError = useCallback((message, details) => {
    return addToast({ message, details, type: 'error' });
  }, [addToast]);
  
  const showWarning = useCallback((message, details) => {
    return addToast({ message, details, type: 'warning' });
  }, [addToast]);
  
  const showInfo = useCallback((message, details) => {
    return addToast({ message, details, type: 'info' });
  }, [addToast]);
  
  const showSuccess = useCallback((message, details) => {
    return addToast({ message, details, type: 'success' });
  }, [addToast]);
  
  const contextValue = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    showError,
    showWarning,
    showInfo,
    showSuccess
  };
  
  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} {...containerProps} />
    </ToastContext.Provider>
  );
};

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
  position: PropTypes.oneOf(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center']),
  autoCloseDelay: PropTypes.number
};

/**
 * Custom hook for using the toast context
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastProvider; 