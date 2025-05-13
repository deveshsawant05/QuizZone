import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

const Input = forwardRef(({
  type = 'text',
  label,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  fullWidth = false,
  className = '',
  labelClassName = '',
  inputClassName = '',
  errorClassName = '',
  helperTextClassName = '',
  endAdornment,
  startAdornment,
  ...rest
}, ref) => {
  
  const inputWrapperClasses = `relative flex items-center rounded-md border ${
    error 
      ? 'border-red-500 bg-red-50' 
      : 'border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500'
  } ${disabled ? 'bg-gray-100' : 'bg-white'}`;
  
  const inputClasses = `block px-3 py-2 w-full text-gray-900 placeholder-gray-400 focus:outline-none ${
    startAdornment ? 'pl-10' : ''
  } ${endAdornment ? 'pr-10' : ''} ${
    disabled ? 'cursor-not-allowed text-gray-500' : ''
  } ${inputClassName}`;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label 
          htmlFor={name} 
          className={`block mb-1 text-sm font-medium text-gray-700 ${labelClassName}`}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className={inputWrapperClasses}>
        {startAdornment && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
            {startAdornment}
          </div>
        )}
        
        <input
          ref={ref}
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={`${name}-error ${name}-helper`}
          {...rest}
        />
        
        {endAdornment && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {endAdornment}
          </div>
        )}
      </div>
      
      {error && (
        <p 
          id={`${name}-error`} 
          className={`mt-1 text-sm text-red-600 ${errorClassName}`}
        >
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p 
          id={`${name}-helper`} 
          className={`mt-1 text-sm text-gray-500 ${helperTextClassName}`}
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  type: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
  labelClassName: PropTypes.string,
  inputClassName: PropTypes.string,
  errorClassName: PropTypes.string,
  helperTextClassName: PropTypes.string,
  endAdornment: PropTypes.node,
  startAdornment: PropTypes.node,
};

export default Input; 