import React from 'react';
import PropTypes from 'prop-types';

/**
 * ErrorFallback component - Displays a user-friendly error message
 */
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  // Log the error to the console for debugging
  React.useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  // Base classes for standard size buttons (md)
  const baseButtonClasses = 'inline-flex items-center justify-center rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 px-4 py-2 text-base';

  return (
    <div 
      role="alert" 
      className="p-8 max-w-xl mx-auto mt-12 bg-red-50 border border-red-200 rounded-lg shadow-lg"
    >
      <div className="text-center mb-6">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-16 w-16 mx-auto text-red-500 mb-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
        <h2 className="text-2xl font-bold text-red-700 mb-2">Something went wrong</h2>
        <p className="text-red-600 mb-4">
          We've encountered an unexpected error in the application.
        </p>
      </div>
      
      <div className="bg-white p-4 rounded-md border border-red-100 mb-6 overflow-auto max-h-40">
        <p className="font-mono text-sm text-red-800 whitespace-pre-wrap">
          {error.message || 'Unknown error occurred'}
        </p>
      </div>
      
      <div className="flex justify-center space-x-4">
        <button
          type="button"
          onClick={() => window.location.href = '/'}
          className={`${baseButtonClasses} bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500`}
        >
          Go to Home
        </button>
        <button
          type="button"
          onClick={resetErrorBoundary}
          className={`${baseButtonClasses} bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500`}
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

ErrorFallback.propTypes = {
  error: PropTypes.object.isRequired,
  resetErrorBoundary: PropTypes.func.isRequired,
};

export default ErrorFallback; 