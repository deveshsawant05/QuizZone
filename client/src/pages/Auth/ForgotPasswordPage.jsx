import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import { createLogger } from '../../utils/debug';
import { withErrorHandling } from '../../utils/errorHandler';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';

// Create dedicated logger
const logger = createLogger('auth:forgot-password');

const ForgotPasswordPage = () => {
  const { forgotPassword, isAuthenticated } = useAuth();
  const { addError } = useError();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      logger.info('User already authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    logger.debug('Email field changed');
    setEmail(e.target.value);
    setError('');
  };

  const validate = () => {
    logger.debug('Validating forgot password form');
    
    if (!email) {
      logger.debug('Validation failed: missing email');
      setError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      logger.debug('Validation failed: invalid email format');
      setError('Email address is invalid');
      return false;
    }
    
    logger.debug('Validation successful');
    return true;
  };

  const handleSubmit = withErrorHandling(async (e) => {
    e.preventDefault();
    logger.info('Forgot password form submitted', { email });
    
    if (!validate()) {
      logger.warn('Form validation failed');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      logger.debug('Attempting forgot password API call');
      await forgotPassword(email);
      logger.info('Password reset email sent successfully', { email });
      setSuccess(true);
    } catch (err) {
      logger.error('Forgot password error', { 
        message: err.message,
        email,
        statusCode: err.statusCode
      });
      
      setError(err.message || 'An error occurred. Please try again.');
      
      // Log the error to error context
      addError({
        source: 'forgotPassword',
        message: err.message || 'Password reset request failed',
        details: err
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Reset Your Password</h1>
        
        {success ? (
          <div className="text-center">
            <div className="bg-green-50 text-green-600 p-4 rounded-md mb-6" role="alert">
              <p>Password reset link has been sent to your email.</p>
              <p className="mt-2 text-sm">Please check your inbox and follow the instructions.</p>
            </div>
            <Link 
              to="/login" 
              className="text-blue-600 hover:text-blue-800 transition"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6 text-center">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4" role="alert">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  value={email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  error={error}
                  required
                  fullWidth
                  autoFocus
                  aria-required="true"
                  data-testid="email-input"
                />
              </div>
              
              <Button
                type="submit"
                variant="primary"
                fullWidth
                className="mt-6"
                isLoading={isSubmitting}
                loadingText="Sending reset link..."
                data-testid="submit-button"
              >
                Send Reset Link
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

export default ForgotPasswordPage; 