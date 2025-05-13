import React from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const ModernInput = ({
  label,
  id,
  name,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  onBlur,
  error,
  success,
  disabled = false,
  required = false,
  autoComplete,
  leftIcon = null,
  rightIcon = null,
  helperText,
  showPassword,
  toggleShowPassword,
  className = '',
  ...props
}) => {
  // Determine whether to render a password toggle
  const isPassword = type === 'password' && toggleShowPassword;
  
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {leftIcon}
          </div>
        )}
        
        <input
          id={id}
          name={name}
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          className={`
            block w-full px-3 py-2 
            ${leftIcon ? 'pl-10' : ''}
            ${isPassword || rightIcon ? 'pr-10' : ''}
            border ${error ? 'border-red-500' : success ? 'border-green-500' : 'border-gray-300'}
            rounded-lg shadow-sm
            placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            transition-all duration-200
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
            ${className}
          `}
          {...props}
        />
        
        {isPassword ? (
          <button
            type="button"
            onClick={toggleShowPassword}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            tabIndex="-1"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        ) : rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {!error && success && (
        <p className="text-sm text-green-600">{success}</p>
      )}
      
      {!error && !success && helperText && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default ModernInput; 