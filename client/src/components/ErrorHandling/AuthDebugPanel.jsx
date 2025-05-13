import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import { debugAuthState, detectAuthIssues } from '../../utils/authDebug';

/**
 * Authentication debugging panel to help diagnose auth-related issues
 * Only visible in debug mode
 */
const AuthDebugPanel = ({ position = 'bottom-left' }) => {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const { isDebugMode } = useError();
  const [expanded, setExpanded] = useState(false);
  const [issues, setIssues] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);

  const positionStyles = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  // Check for auth issues
  const checkAuthIssues = () => {
    const results = detectAuthIssues();
    setIssues(results.issues);
    setLastCheck(results.timestamp);
  };

  useEffect(() => {
    if (isDebugMode) {
      checkAuthIssues();
    }
  }, [isDebugMode, isAuthenticated, isInitialized]);

  // Debug the current auth state in console
  const debugFullState = () => {
    debugAuthState();
  };

  if (!isDebugMode) {
    return null;
  }

  const severityColors = {
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    critical: 'bg-red-200 text-red-900 border-red-300'
  };

  return (
    <div 
      className={`fixed ${positionStyles[position]} z-50 bg-white border border-gray-300 rounded-md shadow-lg overflow-hidden`}
      style={{ 
        maxWidth: expanded ? '400px' : '200px', 
        maxHeight: expanded ? '500px' : '40px',
        transition: 'all 0.3s ease'
      }}
    >
      <div 
        className="flex items-center justify-between bg-gray-100 px-4 py-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="text-sm font-medium">Auth Debug</h3>
        <div className="flex space-x-2">
          <div 
            className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`} 
            title={isAuthenticated ? 'Authenticated' : 'Not authenticated'}
          />
          <span className="text-xs">{expanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {expanded && (
        <div className="p-4 overflow-auto" style={{ maxHeight: '460px' }}>
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <h4 className="text-sm font-medium">Auth Status</h4>
              <button 
                className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                onClick={checkAuthIssues}
              >
                Refresh
              </button>
            </div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Initialized:</span>
                <span className={isInitialized ? 'text-green-600' : 'text-red-600'}>
                  {isInitialized ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Authenticated:</span>
                <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                  {isAuthenticated ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Has User:</span>
                <span className={user ? 'text-green-600' : 'text-red-600'}>
                  {user ? 'Yes' : 'No'}
                </span>
              </div>
              {user && (
                <div className="flex justify-between">
                  <span>User ID:</span>
                  <span className="font-mono">{user._id || 'Unknown'}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Potential Issues</h4>
            {issues && issues.length > 0 ? (
              <div className="space-y-2 text-xs">
                {issues.map((issue, index) => (
                  <div 
                    key={index} 
                    className={`p-2 rounded border ${severityColors[issue.severity] || 'bg-gray-100'}`}
                  >
                    <div className="font-medium">{issue.type}: {issue.message}</div>
                    {issue.detail && <div className="mt-1 text-xs opacity-75">{issue.detail}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-green-600">No issues detected</div>
            )}
            {lastCheck && (
              <div className="text-xs text-gray-500 mt-2">
                Last checked: {new Date(lastCheck).toLocaleTimeString()}
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <button
              className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded"
              onClick={debugFullState}
            >
              Log Full Debug Info
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthDebugPanel; 