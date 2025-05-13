import React from 'react';
import PropTypes from 'prop-types';

const Card = ({
  title,
  subtitle,
  description,
  image,
  badges = [],
  actionButtons = [],
  footer,
  onClick,
  className = '',
  variant = 'default',
  elevation = 'md',
  disabled = false,
}) => {
  // Define variant classes
  const variants = {
    default: 'bg-white',
    primary: 'bg-blue-50',
    secondary: 'bg-gray-50',
    success: 'bg-green-50',
    warning: 'bg-yellow-50',
    danger: 'bg-red-50',
    info: 'bg-cyan-50',
  };

  // Define elevation (shadow) classes
  const elevations = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };

  // Badge variants
  const badgeVariants = {
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-cyan-100 text-cyan-800',
  };

  const variantClass = variants[variant] || variants.default;
  const elevationClass = elevations[elevation] || elevations.md;
  const hasImage = Boolean(image);
  const hasDescription = Boolean(description);
  const hasBadges = badges.length > 0;
  const hasActionButtons = actionButtons.length > 0;
  const hasFooter = Boolean(footer);
  
  const cardClasses = `
    rounded-lg overflow-hidden
    transition duration-200 ease-in-out
    ${variantClass}
    ${elevationClass}
    ${onClick && !disabled ? 'cursor-pointer hover:shadow-lg transform hover:-translate-y-1' : ''}
    ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
    ${className}
  `.trim();

  const handleClick = (e) => {
    if (onClick && !disabled) {
      onClick(e);
    }
  };

  return (
    <div className={cardClasses} onClick={handleClick}>
      {/* Card Image */}
      {hasImage && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Card Content */}
      <div className="p-5">
        {/* Title and Subtitle */}
        <div className="mb-3">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {title}
            </h3>
          )}
          
          {subtitle && (
            <p className="text-sm text-gray-600">
              {subtitle}
            </p>
          )}
        </div>

        {/* Badges */}
        {hasBadges && (
          <div className="flex flex-wrap gap-2 mb-3">
            {badges.map((badge, index) => (
              <span
                key={index}
                className={`
                  inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                  ${badgeVariants[badge.variant || 'secondary']}
                `}
              >
                {badge.text}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {hasDescription && (
          <div className="mb-4">
            <p className="text-gray-700">{description}</p>
          </div>
        )}

        {/* Action Buttons */}
        {hasActionButtons && (
          <div className="flex flex-wrap gap-2 mt-4">
            {actionButtons.map((button, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  if (button.onClick && !button.disabled) {
                    button.onClick(e);
                  }
                }}
                disabled={button.disabled}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-md
                  transition-colors duration-150 ease-in-out
                  ${button.variant === 'outline'
                    ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    : button.variant === 'text'
                    ? 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'}
                  ${button.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  ${button.className || ''}
                `}
              >
                {button.text}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer */}
      {hasFooter && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
          {footer}
        </div>
      )}
    </div>
  );
};

Card.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  description: PropTypes.string,
  image: PropTypes.string,
  badges: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      variant: PropTypes.oneOf([
        'primary',
        'secondary',
        'success',
        'warning',
        'danger',
        'info',
      ]),
    })
  ),
  actionButtons: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      onClick: PropTypes.func,
      variant: PropTypes.oneOf(['outline', 'text', 'filled']),
      disabled: PropTypes.bool,
      className: PropTypes.string,
    })
  ),
  footer: PropTypes.node,
  onClick: PropTypes.func,
  className: PropTypes.string,
  variant: PropTypes.oneOf([
    'default',
    'primary',
    'secondary',
    'success',
    'warning',
    'danger',
    'info',
  ]),
  elevation: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'xl']),
  disabled: PropTypes.bool,
};

export default Card; 