import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

// Pages
import HomePage from './pages/HomePage';
import MarketplacePage from './pages/MarketplacePage';
import MyCardsPage from './pages/MyCardsPage';
import CardDetailPage from './pages/CardDetailPage';

// Providers and Context
import { AppProvider } from './contexts/AppContext';

// Components
import ErrorFallback from './components/common/ErrorFallback';

import { Link } from 'react-router-dom';
import ConnectWallet from './components/common/ConnectWallet';

/**
 * Main application component that sets up routing and global providers
 */

const NAV_LINKS = [
  { name: 'Home', path: '/' },
  { name: 'Marketplace', path: '/marketplace' },
  { name: 'My Cards', path: '/my-cards' },
];



const App = () => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.href = '/'}
    >
      <AppProvider>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white shadow">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                {/* Logo and navigation */}
                <div className="flex items-center space-x-8">
                  <Link to="/" className="text-xl font-bold text-indigo-600">
                    Pokemon Card Trading
                  </Link>
                  
                  <nav className="hidden md:flex space-x-4">
                    {NAV_LINKS.map(link => (
                      <Link 
                        key={link.path}
                        to={link.path} 
                        className="px-3 py-2 rounded hover:bg-gray-100"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </nav>
                </div>
                
                {/* Wallet connection */}
                <ConnectWallet />
              </div>
            </div>
          </header>
          <main className="flex-grow max-w-6xl mx-auto px-4 py-8">
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/my-cards" element={<MyCardsPage />} />
                <Route path="/card/:tokenId" element={<CardDetailPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
          </main>
        </div>
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App; 