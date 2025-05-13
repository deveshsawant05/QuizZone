import { Component } from 'react';
import PropTypes from 'prop-types';
import logger from '../../utils/debug';
import { useError } from '../../context/ErrorContext';

class ErrorBoundaryFallback extends Component {
  render() {
    const { error, resetErrorBoundary, message, showDetails } = this.props;

    return (
      <div className="p-4 border border-red-300 rounded-md bg-red-50 my-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              {message || 'Something went wrong'}
            </h3>
            {showDetails && (
              <div className="mt-2 text-sm text-red-700">
                <p className="font-mono bg-red-100 p-2 rounded overflow-auto max-h-40">
                  {error?.message || 'Unknown error'}
                </p>
              </div>
            )}
            {resetErrorBoundary && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={resetErrorBoundary}
                  className="rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-800 shadow-sm hover:bg-red-200"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

ErrorBoundaryFallback.propTypes = {
  error: PropTypes.object,
  resetErrorBoundary: PropTypes.func,
  message: PropTypes.string,
  showDetails: PropTypes.bool
};

ErrorBoundaryFallback.defaultProps = {
  showDetails: false,
  message: 'Something went wrong in this component'
};

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    logger.error('Component error caught by boundary:', { 
      error, 
      componentStack: errorInfo.componentStack 
    });

    // Report to error context if available
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { children, fallback: CustomFallback, ...fallbackProps } = this.props;
    
    if (this.state.hasError) {
      if (CustomFallback) {
        return <CustomFallback 
          error={this.state.error} 
          resetErrorBoundary={this.reset} 
          {...fallbackProps} 
        />;
      }

      return <ErrorBoundaryFallback 
        error={this.state.error}
        resetErrorBoundary={this.reset}
        {...fallbackProps}
      />;
    }

    return children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.elementType,
  onError: PropTypes.func,
  message: PropTypes.string,
  showDetails: PropTypes.bool
};

// HOC with error context
export const withErrorBoundary = (Component, options = {}) => {
  const WrappedComponent = (props) => {
    const errorContext = useError();
    
    return (
      <ErrorBoundary 
        onError={errorContext.logError} 
        {...options}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  const displayName = Component.displayName || Component.name || 'Component';
  WrappedComponent.displayName = `WithErrorBoundary(${displayName})`;
  
  return WrappedComponent;
};

export default ErrorBoundary; 