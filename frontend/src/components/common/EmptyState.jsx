import React from 'react';

/**
 * EmptyState component - Displays a message when no content is available
 * @param {Object} props
 * @param {string} props.title - Title of the empty state
 * @param {string} props.message - Message to display
 * @param {string} props.buttonText - Text for the action button (optional)
 * @param {Function} props.buttonAction - Function to call when button is clicked (optional)
 */
const EmptyState = ({
  title = 'No Content',
  message = 'There is nothing to display here.',
  buttonText,
  buttonAction
}) => {
  return (
    <div className="text-center py-8 px-4 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6">{message}</p>
      
      {buttonText && buttonAction && (
        <button
          onClick={buttonAction}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};

export default EmptyState; 