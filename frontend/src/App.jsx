import React, { useState } from 'react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.href = '/'}
    >
      <AppProvider>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white shadow relative">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                {/* Logo and navigation */}
                <div className="flex items-center space-x-8">
                  <Link to="/" className="text-xl font-bold text-indigo-600">
                    Pokemon Card Trading
                  </Link>
                  
                  {/* Desktop Navigation */}
                  <nav className="hidden md:flex space-x-4">
                    {NAV_LINKS.map(link => (
                      <Link 
                        key={link.path}
                        to={link.path} 
                        className="px-3 py-2 rounded hover:bg-gray-100 text-sm font-medium"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </nav>
                </div>
                
                {/* Right side: Wallet and Menu */}
                <div className="flex items-center">
                   {/* Wallet connection */}
                  <ConnectWallet />

                  {/* Menu Button */}
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden ml-3 p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                    aria-controls="mobile-menu"
                    aria-expanded={isMobileMenuOpen}
                  >
                    <span className="sr-only">Open main menu</span>
                    {!isMobileMenuOpen ? (
                      <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    ) : (
                      <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg z-50" id="mobile-menu">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                  {NAV_LINKS.map(link => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)} // Close menu on click
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </header>
          <main className="flex-grow max-w-6xl mx-auto px-4 py-8 w-full">
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