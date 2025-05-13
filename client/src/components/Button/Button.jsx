import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

const Button = forwardRef(({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  isLoading = false,
  loadingText,
  icon,
  iconPosition = 'left',
  className = '',
  onClick,
  ...rest
}, ref) => {
  // Define variants
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-400',
    info: 'bg-cyan-500 hover:bg-cyan-600 text-white focus:ring-cyan-400',
    outline: 'bg-transparent hover:bg-gray-50 text-gray-700 border border-gray-300 hover:text-gray-900 focus:ring-gray-300',
    text: 'bg-transparent hover:bg-gray-50 text-blue-600 hover:text-blue-800 focus:ring-blue-300',
  };

  // Define sizes
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Spinner component for loading state
  const Spinner = ({ className }) => (
    <svg 
      className={`animate-spin h-4 w-4 ${className}`} 
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
  );

  const variantClasses = variants[variant] || variants.primary;
  const sizeClasses = sizes[size] || sizes.md;
  
  const buttonClasses = `
    inline-flex items-center justify-center rounded-md
    font-medium focus:outline-none focus:ring-2 focus:ring-offset-2
    transition duration-150 ease-in-out
    ${variantClasses}
    ${sizeClasses}
    ${fullWidth ? 'w-full' : ''}
    ${disabled || isLoading ? 'opacity-70 cursor-not-allowed' : ''}
    ${className}
  `.trim();

  // Handle icon rendering based on position
  const renderIcon = (position) => {
    if (!icon) return null;
    
    const iconElement = typeof icon === 'string' ? (
      <span className={`${position === 'left' ? 'mr-2' : 'ml-2'}`}>{icon}</span>
    ) : (
      <span className={`${position === 'left' ? 'mr-2' : 'ml-2'}`}>{icon}</span>
    );
    
    return iconPosition === position ? iconElement : null;
  };

  // Handle button click
  const handleClick = (e) => {
    if (disabled || isLoading) {
      e.preventDefault();
      return;
    }
    
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...rest}
    >
      {isLoading ? (
        <>
          <Spinner className="mr-2" />
          {loadingText || children}
        </>
      ) : (
        <>
          {renderIcon('left')}
          {children}
          {renderIcon('right')}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  variant: PropTypes.oneOf([
    'primary', 
    'secondary', 
    'success', 
    'danger', 
    'warning', 
    'info', 
    'outline', 
    'text'
  ]),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  loadingText: PropTypes.string,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  className: PropTypes.string,
  onClick: PropTypes.func,
};

export default Button; 