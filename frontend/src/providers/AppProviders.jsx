import React from 'react';
import { AppProvider } from '../contexts/AppContext';

/**
 * A component that provides application state
 * This is much simpler since we consolidated all contexts
 * 
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Child components to be wrapped by providers
 */
const AppProviders = ({ children }) => {
  return (
    <AppProvider>
      {children}
    </AppProvider>
  );
};

export default AppProviders; 