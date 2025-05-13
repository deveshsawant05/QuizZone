import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useError } from '../../context/ErrorContext';

/**
 * DebugPanel component - displays errors and debugging information
 * Only visible in debug mode
 */
const DebugPanel = ({ position = 'bottom-right' }) => {
  const { errors, clearErrors, isDebugMode, toggleDebugMode } = useError();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedErrors, setExpandedErrors] = useState({});

  // Don't render anything if not in debug mode
  if (!isDebugMode) {
    return null;
  }

  // Create a timestamp formatter
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Define position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  // Toggle expanded state for an error
  const toggleErrorExpanded = (errorId) => {
    setExpandedErrors(prev => ({
      ...prev,
      [errorId]: !prev[errorId]
    }));
  };

  // Handle panel toggle
  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`fixed ${positionClasses[position] || positionClasses['bottom-right']} z-50`}>
      {/* Debug mode indicator and toggle button */}
      <div className="mb-2 flex justify-end">
        <button
          onClick={togglePanel}
          className="bg-blue-600 text-white text-xs rounded-full px-3 py-1 font-mono flex items-center"
        >
          <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2"></span>
          Debug {isOpen ? '▲' : '▼'}
        </button>
      </div>

      {/* Debug panel */}
      {isOpen && (
        <div className="bg-gray-800 text-gray-200 rounded-lg shadow-xl w-96 max-h-[70vh] overflow-hidden flex flex-col animate-slideUp">
          {/* Panel header */}
          <div className="bg-gray-700 px-4 py-2 flex justify-between items-center">
            <h3 className="font-mono text-sm">Debug Console</h3>
            <div className="flex space-x-2">
              <button
                onClick={clearErrors}
                className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded"
                title="Clear all errors"
              >
                Clear
              </button>
              <button
                onClick={toggleDebugMode}
                className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded"
                title="Turn off debug mode"
              >
                Disable
              </button>
            </div>
          </div>

          {/* Error list */}
          <div className="overflow-y-auto flex-grow">
            {errors.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                No errors logged
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {errors.map((error) => (
                  <div key={error.id} className="p-3 hover:bg-gray-700/50 text-xs">
                    <div className="flex justify-between items-center">
                      <div className="font-medium text-red-400">{error.source}</div>
                      <div className="text-gray-400">{formatTime(error.timestamp)}</div>
                    </div>
                    <div className="mt-1">{error.message}</div>
                    {error.stack && (
                      <button
                        onClick={() => toggleErrorExpanded(error.id)}
                        className="mt-1 text-gray-400 hover:text-gray-300 text-xs underline"
                      >
                        {expandedErrors[error.id] ? 'Hide stack trace' : 'Show stack trace'}
                      </button>
                    )}
                    {expandedErrors[error.id] && error.stack && (
                      <pre className="mt-2 p-2 bg-gray-900 rounded overflow-x-auto text-xs font-mono max-h-40">
                        {error.stack}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel footer */}
          <div className="bg-gray-700 px-4 py-2 text-xs text-gray-400">
            Logged errors: {errors.length}
          </div>
        </div>
      )}
    </div>
  );
};

DebugPanel.propTypes = {
  position: PropTypes.oneOf(['top-left', 'top-right', 'bottom-left', 'bottom-right'])
};

export default DebugPanel; 