import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ModernInput from '../Input/ModernInput';
import ModernButton from '../Button/ModernButton';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import AuthCard from './AuthCard';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await api.auth.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(
        err.message ||
        'Unable to process your request. Please try again or contact support.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link"
      footer={
        <span>
          Remember your password?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </span>
      }
    >
      {success ? (
        <div className="mt-8 text-center">
          <div className="rounded-md bg-green-50 p-4 mb-6">
            <div className="text-sm text-green-700">
              Password reset link sent! Please check your email.
            </div>
          </div>
          <ModernButton
            as={Link}
            to="/login"
            variant="primary"
            rounded="lg"
          >
            Return to Sign In
          </ModernButton>
        </div>
      ) : (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          
          <ModernInput
            label="Email address"
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error && !email ? 'Email is required' : ''}
            leftIcon={<EnvelopeIcon className="h-5 w-5" />}
            placeholder="your@email.com"
          />
          
          <ModernButton
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
            loadingText="Sending link..."
            rounded="lg"
            size="lg"
          >
            Send Reset Link
          </ModernButton>
        </form>
      )}
    </AuthCard>
  );
};

export default ForgotPasswordForm; 