import { createLogger } from './debug';

const authDebugger = createLogger('auth:debug');

/**
 * Logs detailed authentication token information
 * Useful for debugging token-related issues
 * 
 * @param {string} tokenType - Type of token (access, refresh, etc.)
 * @param {string} token - The actual token
 * @returns {object} Basic token info for further use
 */
export const debugToken = (tokenType, token) => {
  if (!token) {
    authDebugger.warn(`No ${tokenType} token present`);
    return null;
  }

  try {
    // Safely extract parts of JWT without revealing too much sensitive info
    const [header, payload] = token.split('.');
    
    if (!header || !payload) {
      authDebugger.error(`Invalid ${tokenType} token format`);
      return null;
    }
    
    try {
      // Decode the header
      const decodedHeader = JSON.parse(atob(header));
      authDebugger.debug(`${tokenType} token header`, { 
        alg: decodedHeader.alg,
        typ: decodedHeader.typ 
      });
      
      // Decode the payload but only log non-sensitive parts
      const decodedPayload = JSON.parse(atob(payload));
      const tokenInfo = {
        exp: decodedPayload.exp ? new Date(decodedPayload.exp * 1000).toISOString() : 'none',
        iat: decodedPayload.iat ? new Date(decodedPayload.iat * 1000).toISOString() : 'none',
        tokenLength: token.length,
        hasUserId: !!decodedPayload.id || !!decodedPayload.sub,
      };
      
      const now = Math.floor(Date.now() / 1000);
      const expiration = decodedPayload.exp;
      
      if (expiration) {
        const remainingTime = expiration - now;
        tokenInfo.expiresIn = `${Math.max(0, remainingTime)} seconds`;
        tokenInfo.isExpired = remainingTime <= 0;
        
        if (tokenInfo.isExpired) {
          authDebugger.warn(`${tokenType} token is expired`);
        } else if (remainingTime < 300) { // Less than 5 minutes
          authDebugger.warn(`${tokenType} token expires soon`, { 
            remainingSeconds: remainingTime 
          });
        } else {
          authDebugger.info(`${tokenType} token is valid`, { 
            remainingSeconds: remainingTime 
          });
        }
      } else {
        authDebugger.warn(`${tokenType} token has no expiration`);
      }
      
      authDebugger.debug(`${tokenType} token info`, tokenInfo);
      return tokenInfo;
    } catch (decodeError) {
      authDebugger.error(`Error decoding ${tokenType} token`, { error: decodeError.message });
      return null;
    }
  } catch (error) {
    authDebugger.error(`Error analyzing ${tokenType} token`, { error: error.message });
    return null;
  }
};

/**
 * Analyzes the stored tokens in localStorage
 * Useful for debugging authentication state
 */
export const debugAuthState = () => {
  authDebugger.group('Authentication State Analysis');
  
  try {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    authDebugger.info('Auth tokens check', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken
    });
    
    const accessTokenInfo = debugToken('access', accessToken);
    const refreshTokenInfo = debugToken('refresh', refreshToken);
    
    if (accessTokenInfo && refreshTokenInfo) {
      authDebugger.info('Both tokens present and parsed');
    } else if (accessTokenInfo) {
      authDebugger.warn('Only access token present or valid');
    } else if (refreshTokenInfo) {
      authDebugger.warn('Only refresh token present or valid');
    } else {
      authDebugger.error('No valid tokens found');
    }
  } catch (error) {
    authDebugger.error('Error analyzing auth state', { error: error.message });
  }
  
  authDebugger.groupEnd();
};

/**
 * Helper to detect common authentication issues
 * @returns {object} Diagnostic information about potential issues
 */
export const detectAuthIssues = () => {
  authDebugger.info('Running auth issues detection');
  const issues = [];
  
  try {
    // Check for localStorage availability (private browsing mode issues)
    try {
      localStorage.setItem('auth_test', '1');
      localStorage.removeItem('auth_test');
    } catch (e) {
      issues.push({
        type: 'localStorage',
        severity: 'critical',
        message: 'localStorage is not available. Authentication will not work.',
        detail: e.message
      });
    }
    
    // Check for token presence and validity
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!accessToken && !refreshToken) {
      issues.push({
        type: 'tokens',
        severity: 'info',
        message: 'No auth tokens found. User is not logged in.'
      });
    } else {
      // Analyze tokens if present
      if (accessToken) {
        try {
          const [, payload] = accessToken.split('.');
          const decoded = JSON.parse(atob(payload));
          const now = Math.floor(Date.now() / 1000);
          
          if (decoded.exp && decoded.exp < now) {
            issues.push({
              type: 'accessToken',
              severity: 'warning',
              message: 'Access token is expired.',
              expiredAt: new Date(decoded.exp * 1000).toISOString()
            });
          }
        } catch (e) {
          issues.push({
            type: 'accessToken',
            severity: 'error',
            message: 'Access token is invalid or malformed.',
            detail: e.message
          });
        }
      } else {
        issues.push({
          type: 'accessToken',
          severity: 'warning',
          message: 'Access token is missing but refresh token exists.'
        });
      }
      
      if (!refreshToken && accessToken) {
        issues.push({
          type: 'refreshToken',
          severity: 'warning',
          message: 'Refresh token is missing but access token exists.'
        });
      }
    }
    
    authDebugger.debug('Auth issues detection complete', { 
      issuesFound: issues.length,
      issues 
    });
    
    return {
      hasIssues: issues.length > 0,
      issues,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    authDebugger.error('Error in auth issues detection', { error: error.message });
    return {
      hasIssues: true,
      issues: [{
        type: 'detection',
        severity: 'error',
        message: 'Error running auth diagnostics',
        detail: error.message
      }],
      timestamp: new Date().toISOString()
    };
  }
};

export default {
  debugToken,
  debugAuthState,
  detectAuthIssues
}; 