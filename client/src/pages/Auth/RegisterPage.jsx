import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useError } from '../../context/ErrorContext';
import { createLogger } from '../../utils/debug';
import { withErrorHandling } from '../../utils/errorHandler';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';

// Create dedicated logger
const logger = createLogger('auth:register');

const RegisterPage = () => {
  const { register, error: authError, isAuthenticated } = useAuth();
  const { addError } = useError();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      logger.info('User already authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
    logger.debug('Validating registration form');
    const newErrors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email address is invalid';
    }
    
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
    logger.info('Registration form submitted', { email: formData.email, name: formData.name });
    
    if (!validate()) {
      logger.warn('Form validation failed');
      return;
    }
    
    setIsSubmitting(true);
    setApiError('');
    
    try {
      logger.debug('Attempting registration API call');
      await register(formData);
      logger.info('Registration successful, redirecting to dashboard');
      navigate('/dashboard');
    } catch (err) {
      logger.error('Registration error', { 
        message: err.message,
        errors: err.errors || {},
        statusCode: err.statusCode,
        email: formData.email
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
        setApiError(err.message || 'Registration failed. Please try again.');
      }
      
      // Log the error to error context
      addError({
        source: 'registration',
        message: err.message || 'Registration failed',
        details: err
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Create Your Account</h1>
        
        {(apiError || authError) && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4" role="alert">
            {apiError || authError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              error={errors.name}
              required
              fullWidth
              autoFocus
              aria-required="true"
            />
            
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
              aria-required="true"
            />
            
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              error={errors.password}
              required
              fullWidth
              helperText="Must be at least 8 characters"
              aria-required="true"
            />
            
            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              error={errors.confirmPassword}
              required
              fullWidth
              aria-required="true"
            />
          </div>
          
          <Button
            type="submit"
            variant="primary"
            fullWidth
            className="mt-6"
            isLoading={isSubmitting}
            loadingText="Creating account..."
          >
            Create Account
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-800 transition">
              Log in
            </Link>
          </p>
        </div>
        
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>
            By creating an account, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-800 transition">
              Terms of Service
            </a>
            {' and '}
            <a href="#" className="text-blue-600 hover:text-blue-800 transition">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 