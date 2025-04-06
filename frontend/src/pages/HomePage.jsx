import React, { useState, useEffect } from 'react';

import { useApp } from '../contexts/AppContext';
import PokemonCard from '../components/specific/PokemonCard';


const FeatureItem = ({ icon, title, description }) => (
  <div className="flex flex-col items-center p-6 border border-gray-200 rounded-lg shadow-sm">
    <div className="text-3xl mb-4">{icon}</div>
    <h3 className="text-lg font-medium mb-2">{title}</h3>
    <p className="text-gray-600 text-center">{description}</p>
  </div>
);

// Skeleton loader for cards
const CardSkeleton = () => (
  <div className="animate-pulse">
    <div className="aspect-square bg-gray-200 rounded-lg mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
  </div>
);

/**
 * HomePage component - Landing page for the application
 */
const HomePage = () => {
  const { 
    account,
    connectWallet,
    getAllListings,
    contracts,
    runDiagnostics,
    formatDiagnosticResults
  } = useApp();
  
  const [loading, setLoading] = useState(true);
  const [diagnosticResults, setDiagnosticResults] = useState(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [featuredCards, setFeaturedCards] = useState([]);


  // Check if we're in development mode
  const isDev = import.meta.env.MODE === 'development';


  const fetchFeaturedCards = async () => {
    setLoading(true);
    try {
      let listings = await getAllListings();
      
      if (listings && listings.length > 0) {
        // Take random 4
        listings = listings.sort(() => 0.5 - Math.random());
        const selectedCards = listings.slice(0, 4);
        setFeaturedCards(selectedCards);
      } else {
        setFeaturedCards([]);
      }
    } catch (error) {
      console.warn('Error fetching featured cards:', error);
      setFeaturedCards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if account is connected
    if (account) {
      fetchFeaturedCards();
    } else {
      setFeaturedCards([]);
      setLoading(false);
    }
  }, [account, getAllListings]);

  const handleRunDiagnostics = async () => {
    try {
      const results = await runDiagnostics();
      setDiagnosticResults(results);
      setShowDiagnostics(true);
    } catch (error) {
      console.error('Error running diagnostics:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Pokemon Card Trading dApp
      </h1>
      
      {/* Development mode banner */}
      {isDev && (
        <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 mb-6 rounded shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                Development Mode: Showing mock data for cards and listings that do not exist.
              </p>
              <p className="text-xs mt-1">
                This doesn't affect the behavior of real cards, but allows for easy testing with the mock cards.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Contract status indicator */}
      {account && isDev && (
        <div className="bg-gray-100 p-4 mb-6 rounded shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="font-medium mr-2">Contract status:</span>
              {contracts.tokenContract ? (
                <span className="flex items-center text-green-700">
                  <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                  Connected
                </span>
              ) : (
                <span className="flex items-center text-red-700">
                  <span className="h-2 w-2 bg-red-500 rounded-full mr-1"></span>
                  Disconnected
                </span>
              )}
              {isDev && (
                <span className="ml-2 text-xs text-gray-500">(Mock data available in development)</span>
              )}
            </div>
            <button
              onClick={handleRunDiagnostics}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
            >
              Run Diagnostics
            </button>
          </div>
          
          {showDiagnostics && diagnosticResults && (
            <div className="mt-4 p-3 bg-white rounded border border-gray-200 text-sm">
              <h3 className="font-medium mb-2">Diagnostic Results:</h3>
              <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-60">
                {formatDiagnosticResults(diagnosticResults)}
              </pre>
            </div>
          )}
        </div>
      )}
      
      {!account ? (
        <div className="flex flex-col items-center justify-center mb-12">
          <p className="text-xl mb-6">
            Connect your wallet to start trading Pokemon cards!
          </p>
          <button
            onClick={connectWallet}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <section className="text-center py-12 mb-16">
            <h1 className="text-4xl font-bold mb-4">Crypto Pokémon Card Trading</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Collect, trade, and sell unique Pokémon cards on the blockchain with secure ownership and transparent transactions.
            </p>
            
            <div className="flex justify-center gap-4 flex-wrap">
              {!account && (
                <button 
                  onClick={connectWallet}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </section>

          {/* Featured Cards */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-center">Featured Cards</h2>
            
            {!account ? (
              <div className="p-8 text-center text-gray-500">
                <p>Connect your wallet to see featured cards</p>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <CardSkeleton key={`skeleton-${i}`} />
                ))}
              </div>
            ) : featuredCards.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No featured cards available at this time</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {featuredCards.map(tokenIds => (
                  <PokemonCard tokenId={tokenIds}/>
                ))}
              </div>
            )}
          </section>

          {/* Features Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-center">Why Crypto Pokémon Cards?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureItem 
                icon="🔍"
                title="Unique Cards"
                description="Each card has different rarities and authenticity verified on the blockchain."
              />
              <FeatureItem 
                icon="💰"
                title="Buy & Sell"
                description="Purchase cards directly or participate in auctions to get the cards you want."
              />
              <FeatureItem 
                icon="🔒"
                title="Secure Ownership"
                description="Your collection is securely stored on the blockchain with proof of ownership."
              />
            </div>
          </section>

          {/* How It Works */}
          <section>
            <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
            <div className="max-w-3xl mx-auto">
              <ol className="space-y-6">
                <li className="flex items-start">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-indigo-600 text-white rounded-full mr-3">1</span>
                  <div>
                    <h3 className="font-semibold">Connect Your Wallet</h3>
                    <p className="text-gray-600">Link your Ethereum wallet to start collecting and trading cards.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-indigo-600 text-white rounded-full mr-3">2</span>
                  <div>
                    <h3 className="font-semibold">Browse the Marketplace</h3>
                    <p className="text-gray-600">Explore available cards or filter by rarity, price, and type.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-indigo-600 text-white rounded-full mr-3">3</span>
                  <div>
                    <h3 className="font-semibold">Buy or Bid on Cards</h3>
                    <p className="text-gray-600">Purchase cards directly or participate in auctions.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-indigo-600 text-white rounded-full mr-3">4</span>
                  <div>
                    <h3 className="font-semibold">Manage Your Collection</h3>
                    <p className="text-gray-600">View, list, or auction your owned cards in your personal collection.</p>
                  </div>
                </li>
              </ol>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default HomePage; 