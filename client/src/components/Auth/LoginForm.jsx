import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ModernInput from '../Input/ModernInput';
import ModernButton from '../Button/ModernButton';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socketService';
import AuthCard from './AuthCard';

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, error: authError } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
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
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      setErrors({}); // Clear any previous errors
      
      // Make sure we're sending the correct format expected by the backend
      const loginData = {
        email: formData.email,
        password: formData.password
      };
      
      const user = await login(loginData);
      
      // Initialize socket connection after successful login
      const token = localStorage.getItem('token');
      if (token) {
        socketService.initializeSocket(token);
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Login form error:', error);
      
      // Handle structured error response from backend
      if (error.response?.data?.errors) {
        // Map backend validation errors to form fields
        const backendErrors = error.response.data.errors;
        setErrors({
          ...backendErrors,
          general: error.response.data.message || 'Failed to login'
        });
      } else {
        setErrors({
          general: error.message || authError || 'An error occurred during login',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your account to continue"
      footer={
        <span>
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign up
          </Link>
        </span>
      }
    >
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {errors.general && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{errors.general}</div>
          </div>
        )}
        
        <ModernInput
          label="Email address"
          type="email"
          id="email"
          name="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          leftIcon={<EnvelopeIcon className="h-5 w-5" />}
          placeholder="your@email.com"
        />
        
        <ModernInput
          label="Password"
          type="password"
          id="password"
          name="password"
          autoComplete="current-password"
          required
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          leftIcon={<LockClosedIcon className="h-5 w-5" />}
          showPassword={showPassword}
          toggleShowPassword={() => setShowPassword(!showPassword)}
          placeholder="••••••••"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>
          
          <div className="text-sm">
            <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
              Forgot password?
            </Link>
          </div>
        </div>

        <ModernButton
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isLoading}
          loadingText="Signing in..."
          rounded="lg"
          size="lg"
        >
          Sign in
        </ModernButton>
      </form>
    </AuthCard>
  );
};

export default LoginForm; 