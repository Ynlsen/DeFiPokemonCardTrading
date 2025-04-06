import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import PokemonCard from '../components/specific/PokemonCard';
import FilterBar from '../components/specific/FilterBar';
import EmptyState from '../components/common/EmptyState';
import { formatEth } from '../utils';

/**
 * MarketplacePage component - Shows all cards listed on the marketplace
 */
const MarketplacePage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const { 
    getAllListedCards,
    connectWallet,
    account
  } = useApp();

  
  // Filtering and sorting options
  const [filters, setFilters] = useState({
    type: 'all',
    rarity: 'all',
    minPrice: '',
    maxPrice: '',
    showAuction: true,
    showFixedPrice: true,
    sortBy: 'idUp'
  });


  // Fetch listings when account is available
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const data = await getAllListedCards();
        setListings(data);
      } catch (err) {
        console.error('Error fetching marketplace listings:', err);
        setListings([]); // Clear listings on error
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if account is connected
    if (account) {
      fetchListings();
    } else {
      // Clear listings if user disconnects
      setListings([]);
      setLoading(false);
    }
  }, [account, getAllListedCards]); // Depend on account and the fetch function

  // Memoize the filtered listings to prevent unnecessary re-renders
  const filteredListings = useMemo(() => {
    return listings.filter(card => {
      // Skip cards without valid listing data
      if (!card || !card.listing) {
        return false;
      }
      
      // Apply rarity filter
      if (filters.rarity && filters.rarity !== 'all' && String(card.rarity) !== filters.rarity) {
        return false;
      }
      
      // Apply auction filter
      if (!filters.showAuction && card.listing.isAuction) {
        return false;
      }
      
      // Apply fixed price filter
      if (!filters.showFixedPrice && !card.listing.isAuction) {
        return false;
      }
      
      // Apply price filter
      const price = parseFloat(formatEth(Math.max(card.listing.highestBid, card.listing.price)));
      
      if (filters.minPrice && price < parseFloat(filters.minPrice)) {
        return false;
      }
      
      if (filters.maxPrice && price > parseFloat(filters.maxPrice)) {
        return false;
      }
      
      return true;
    });
  }, [listings, filters]);

  // Memoize the sorted listings
  const displayListings = useMemo(() => {
    return [...filteredListings].sort((a, b) => {
      // Sort by selected criteria
      switch (filters.sortBy) {
        case 'idUp':
          return (a.tokenId) - (b.tokenId);
        case 'idDown':
          return (b.tokenId) - (a.tokenId);
        case 'priceAsc':
          return parseFloat(Math.max(a.listing.highestBid, a.listing.price)) - 
                 parseFloat(Math.max(b.listing.highestBid, b.listing.price));
        case 'priceDesc':
          return parseFloat(Math.max(b.listing.highestBid, b.listing.price)) - 
                 parseFloat(Math.max(a.listing.highestBid, a.listing.price));
        default:
          return 0;
      }
    });
  }, [filteredListings, filters.sortBy]);

  // Update filters based on filter bar changes
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Get all unique types from cards to populate filter options
  const cardTypes = ["normal","fighting","flying","poison","ground","rock","bug","ghost","fire","water","grass","electric","psychic","ice","dragon"];


  // Handle clear filters action
  const clearFilters = useCallback(() => {
    setFilters({
      type: 'all',
      rarity: 'all',
      minPrice: '',
      maxPrice: '',
      showAuction: true,
      showFixedPrice: true,
      sortBy: 'idUp'
    });
  }, []);

  // Content for not connected state
  if (!account) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <EmptyState
          title="Connect Wallet"
          message="Connect your wallet to view marketplace listings"
          buttonText="Connect Wallet"
          buttonAction={connectWallet}
        />
      </div>
    );
  }

  // Content for loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="mt-4">Loading marketplace listings...</p>
      </div>
    );
  }

  // Content foör empty listings
  if (!displayListings.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          cardTypes={cardTypes}
        />
        <EmptyState
          title="No Listings Found"
          message="No listings match your filters"
          buttonText="Clear Filters"
          buttonAction={clearFilters}
        />
      </div>
    );
  }

  // Main content
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Marketplace</h1>
      
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        cardTypes={cardTypes}
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
        {displayListings.map(card => (
          <PokemonCard tokenId={card.tokenId} fType={filters.type}/>
        ))}
      </div>
    </div>
  );
};

export default MarketplacePage; 