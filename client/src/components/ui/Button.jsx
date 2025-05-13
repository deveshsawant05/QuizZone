import React from 'react';

const Button = ({ 
  children, 
  type = 'primary', 
  onClick, 
  className = '', 
  disabled = false,
  fullWidth = false,
  ...props 
}) => {
  const baseClasses = "px-4 py-2 rounded font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";
  
  const typeClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500"
  };
  
  const disabledClasses = "opacity-50 cursor-not-allowed";
  const widthClass = fullWidth ? "w-full" : "";
  
  return (
    <button
      className={`${baseClasses} ${typeClasses[type]} ${disabled ? disabledClasses : ''} ${widthClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button; 