import React from 'react';
import PropTypes from 'prop-types';

/**
 * PageHeader component for consistent page headers across the application
 * @param {Object} props - Component props
 * @param {string} props.title - Page title
 * @param {string} [props.description] - Optional description text
 * @param {React.ReactNode} [props.action] - Optional action element (button, etc.)
 */
const PageHeader = ({ title, description, action }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        {description && <p className="text-gray-600">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.node
};

export default PageHeader; 