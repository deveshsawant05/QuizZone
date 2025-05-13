import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import { createLogger } from '../../utils/debug';
import { withErrorHandling } from '../../utils/errorHandler';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';

// Create dedicated logger
const logger = createLogger('auth:reset-password');

const ResetPasswordPage = () => {
  const { token } = useParams();
  const { resetPassword, isAuthenticated } = useAuth();
  const { addError } = useError();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      logger.info('User already authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Validate token exists
  useEffect(() => {
    if (!token) {
      logger.error('No reset token provided in URL');
      setApiError('Invalid or missing password reset token');
    } else {
      logger.debug('Reset token found in URL params', { tokenLength: token.length });
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    logger.debug('Form field changed', { field: name, hasValue: !!value });
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
    
    // Clear API error when user makes changes
    if (apiError) {
      setApiError('');
    }
  };

  const validate = () => {
    logger.debug('Validating reset password form');
    const newErrors = {};
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      logger.debug('Validation failed', { errors: Object.keys(newErrors) });
    } else {
      logger.debug('Validation successful');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = withErrorHandling(async (e) => {
    e.preventDefault();
    logger.info('Reset password form submitted');
    
    if (!validate()) {
      logger.warn('Form validation failed');
      return;
    }
    
    setIsSubmitting(true);
    setApiError('');
    
    try {
      logger.debug('Attempting reset password API call');
      await resetPassword(token, formData.password, formData.confirmPassword);
      logger.info('Password reset successful');
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        logger.debug('Redirecting to login page after successful reset');
        navigate('/login');
      }, 3000);
    } catch (err) {
      logger.error('Password reset error', { 
        message: err.message, 
        statusCode: err.statusCode,
        errors: err.errors || {}
      });
      
      if (err.errors && Object.keys(err.errors).length > 0) {
        // Format specific field errors
        const fieldErrors = {};
        Object.entries(err.errors).forEach(([key, value]) => {
          fieldErrors[key] = Array.isArray(value) ? value[0] : value;
        });
        logger.debug('Setting field-specific errors', { fields: Object.keys(fieldErrors) });
        setErrors(fieldErrors);
      } else {
        // Set general API error
        logger.debug('Setting general API error', { message: err.message });
        setApiError(err.message || 'Password reset failed. Please try again.');
      }
      
      // Log the error to error context
      addError({
        source: 'resetPassword',
        message: err.message || 'Password reset failed',
        details: err
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Create New Password</h1>
        
        {success ? (
          <div className="text-center">
            <div className="bg-green-50 text-green-600 p-4 rounded-md mb-6" role="alert">
              <p>Your password has been reset successfully!</p>
              <p className="mt-2 text-sm">You'll be redirected to login page in a few seconds...</p>
            </div>
            <Link 
              to="/login" 
              className="text-blue-600 hover:text-blue-800 transition"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6 text-center">
              Enter your new password below.
            </p>
            
            {apiError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4" role="alert">
                {apiError}
              </div>
            )}
            
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-4">
                <Input
                  label="New Password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  error={errors.password}
                  required
                  fullWidth
                  autoFocus
                  helperText="Must be at least 8 characters"
                  aria-required="true"
                  data-testid="password-input"
                />
                
                <Input
                  label="Confirm Password"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your new password"
                  error={errors.confirmPassword}
                  required
                  fullWidth
                  aria-required="true"
                  data-testid="confirm-password-input"
                />
              </div>
              
              <Button
                type="submit"
                variant="primary"
                fullWidth
                className="mt-6"
                isLoading={isSubmitting}
                loadingText="Resetting password..."
                data-testid="submit-button"
                disabled={!token}
              >
                Reset Password
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <Link 
                to="/login" 
                className="text-blue-600 hover:text-blue-800 transition"
              >
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage; 