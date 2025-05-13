import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ModernInput from '../Input/ModernInput';
import ModernButton from '../Button/ModernButton';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import AuthCard from './AuthCard';

const ResetPasswordForm = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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
      setErrors({});
      
      await api.auth.resetPassword(
        token,
        formData.password,
        formData.confirmPassword
      );
      
      setSuccess(true);
      
      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Reset password error:', error);
      
      // Handle structured error response from backend
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        setErrors({
          ...backendErrors,
          general: error.response.data.message || 'Failed to reset password'
        });
      } else {
        setErrors({
          general: error.message || 'An error occurred during password reset',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Reset Password"
      subtitle="Create a new password for your account"
    >
      {success ? (
        <div className="mt-8 text-center">
          <div className="rounded-md bg-green-50 p-4 mb-6">
            <div className="text-sm text-green-700">
              Your password has been reset successfully! Redirecting to login...
            </div>
          </div>
          <ModernButton
            as={Link}
            to="/login"
            variant="primary"
            rounded="lg"
          >
            Go to Sign In
          </ModernButton>
        </div>
      ) : (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{errors.general}</div>
            </div>
          )}
          
          <ModernInput
            label="New Password"
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
          
          <ModernButton
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
            loadingText="Resetting password..."
            rounded="lg"
            size="lg"
          >
            Reset Password
          </ModernButton>
        </form>
      )}
    </AuthCard>
  );
};

export default ResetPasswordForm; 