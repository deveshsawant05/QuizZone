import React from 'react';

const variants = {
  primary: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 focus:ring-indigo-500',
  secondary: 'bg-gray-800 text-white shadow-lg shadow-gray-800/30 hover:bg-gray-900 focus:ring-gray-500',
  success: 'bg-green-600 text-white shadow-lg shadow-green-500/30 hover:bg-green-700 focus:ring-green-500',
  danger: 'bg-red-600 text-white shadow-lg shadow-red-500/30 hover:bg-red-700 focus:ring-red-500',
  outline: 'bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500',
  ghost: 'bg-transparent text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500',
};

const sizes = {
  xs: 'py-1 px-2 text-xs',
  sm: 'py-2 px-3 text-sm',
  md: 'py-2.5 px-4 text-base',
  lg: 'py-3 px-6 text-lg',
  xl: 'py-4 px-8 text-xl',
};

const ModernButton = ({
  children,
  type = 'button',
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  rounded = 'md',
  leftIcon = null,
  rightIcon = null,
  isLoading = false,
  loadingText = 'Loading...',
  onClick,
  ...props
}) => {
  const roundedClass = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  }[rounded] || 'rounded-md';

  return (
    <button
      type={type}
      className={`
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${roundedClass}
        ${fullWidth ? 'w-full' : ''}
        font-medium focus:outline-none focus:ring-2 focus:ring-offset-2
        transition-all duration-200 ease-in-out
        flex items-center justify-center
        ${disabled || isLoading ? 'opacity-60 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <>
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {loadingText}
        </>
      ) : (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default ModernButton; 