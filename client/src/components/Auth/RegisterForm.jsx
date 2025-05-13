import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ModernInput from '../Input/ModernInput';
import ModernButton from '../Button/ModernButton';
import { EnvelopeIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socketService';
import AuthCard from './AuthCard';

const RegisterForm = () => {
  const navigate = useNavigate();
  const { register, error: authError } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      
      // Extract only the needed fields for registration and ensure proper format
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      };
      
      const user = await register(registrationData);
      
      // Initialize socket connection after successful registration
      const token = localStorage.getItem('token');
      if (token) {
        socketService.initializeSocket(token);
      }
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle structured error response from backend
      if (error.response?.data?.errors) {
        // Map backend validation errors to form fields
        const backendErrors = error.response.data.errors;
        setErrors({
          ...backendErrors,
          general: error.response.data.message || 'Failed to register'
        });
      } else {
        setErrors({
          general: error.message || authError || 'An error occurred during registration',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Join QuizZone"
      subtitle="Create your account to get started"
      footer={
        <span>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
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
          label="Full Name"
          type="text"
          id="name"
          name="name"
          autoComplete="name"
          required
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          leftIcon={<UserIcon className="h-5 w-5" />}
          placeholder="John Doe"
        />
        
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
          autoComplete="new-password"
          required
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          leftIcon={<LockClosedIcon className="h-5 w-5" />}
          showPassword={showPassword}
          toggleShowPassword={() => setShowPassword(!showPassword)}
          placeholder="••••••••"
          helperText="Must be at least 8 characters"
        />
        
        <ModernInput
          label="Confirm Password"
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          required
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          leftIcon={<LockClosedIcon className="h-5 w-5" />}
          showPassword={showConfirmPassword}
          toggleShowPassword={() => setShowConfirmPassword(!showConfirmPassword)}
          placeholder="••••••••"
        />
        
        <div className="flex items-center">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            required
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
            I agree to the{' '}
            <Link to="/terms" className="font-medium text-indigo-600 hover:text-indigo-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="font-medium text-indigo-600 hover:text-indigo-500">
              Privacy Policy
            </Link>
          </label>
        </div>

        <ModernButton
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isLoading}
          loadingText="Creating account..."
          rounded="lg"
          size="lg"
        >
          Create account
        </ModernButton>
      </form>
    </AuthCard>
  );
};

export default RegisterForm; 