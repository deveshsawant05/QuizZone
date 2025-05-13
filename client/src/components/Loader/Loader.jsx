import React from 'react';

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const colors = {
  primary: 'text-indigo-600',
  secondary: 'text-gray-600',
  white: 'text-white',
};

const Loader = ({ 
  size = 'md', 
  color = 'primary', 
  className = '',
  fullScreen = false,
}) => {
  const loaderClasses = `
    animate-spin rounded-full border-t-transparent
    border-2 ${sizes[size]} ${colors[color]} ${className}
  `;

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
        <div className={loaderClasses} />
      </div>
    );
  }

  return <div className={loaderClasses} />;
};

const LoaderWithText = ({
  text = 'Loading...',
  size = 'md',
  color = 'primary',
  textClassName = '',
  ...props
}) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <Loader size={size} color={color} {...props} />
      <p className={`mt-2 text-sm ${colors[color]} ${textClassName}`}>{text}</p>
    </div>
  );
};

Loader.WithText = LoaderWithText;

export default Loader; 