import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import { createLogger } from '../../utils/debug';
import { withErrorHandling } from '../../utils/errorHandler';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';

// Create dedicated logger
const logger = createLogger('auth:login');

const LoginPage = () => {
  const { login, error: authError, isAuthenticated } = useAuth();
  const { logError } = useError();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      logger.info('User already authenticated, redirecting to dashboard');
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

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
    logger.debug('Validating login form');
    const newErrors = {};
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email address is invalid';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
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
    logger.info('Login form submitted', { email: formData.email });
    
    if (!validate()) {
      logger.warn('Form validation failed');
      return;
    }
    
    setIsSubmitting(true);
    setApiError('');
    
    try {
      logger.debug('Attempting login API call');
      await login(formData);
      logger.info('Login successful, redirecting', { to: from });
      navigate(from, { replace: true });
    } catch (err) {
      logger.error('Login error', { 
        message: err.message,
        errors: err.errors || {},
        statusCode: err.statusCode
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
        setApiError(err.message || 'Invalid email or password. Please try again.');
      }
      
      // Log the error to error context
      logError(err, 'login');
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Log In to QuizZone</h1>
        
        {(apiError || authError) && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
            {apiError || authError}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              error={errors.email}
              required
              fullWidth
              autoFocus
            />
            
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              error={errors.password}
              required
              fullWidth
            />
            
            <div className="flex justify-end">
              <Link 
                to="/forgot-password" 
                className="text-sm text-blue-600 hover:text-blue-800 transition"
              >
                Forgot your password?
              </Link>
            </div>
          </div>
          
          <Button
            type="submit"
            variant="primary"
            fullWidth
            className="mt-6"
            isLoading={isSubmitting}
            loadingText="Logging in..."
          >
            Log In
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-800 transition">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 