import React from 'react';
import PropTypes from 'prop-types';

/**
 * Simple LoadingSpinner component for consistent loading indicators
 * @param {object} props - Component props
 * @param {string} [props.size='md'] - Size of the spinner (sm, md, lg)
 * @param {string} [props.color='indigo'] - Color of the spinner
 * @param {string} [props.className=''] - Additional CSS classes
 */
const LoadingSpinner = ({ size = 'md', color = 'indigo', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4'
  };
  
  return (
    <div 
      className={`${sizeClasses[size]} border-${color}-500 border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  color: PropTypes.string,
  className: PropTypes.string
};

export default LoadingSpinner; 