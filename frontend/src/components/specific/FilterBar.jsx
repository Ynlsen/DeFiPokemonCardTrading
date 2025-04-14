import React from 'react';
import { getRarityName } from '../../utils';

/**
 * FilterBar component - Provides filtering options for the marketplace
 */
const FilterBar = ({ filters, onFilterChange, cardTypes = [] }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    onFilterChange({
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">Filters</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Type filter */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium mb-1 text-gray-700">
            Type
          </label>
          <select
            id="type"
            name="type"
            value={filters.type}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Types</option>
            {cardTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        {/* Rarity filter */}
        <div>
          <label htmlFor="rarity" className="block text-sm font-medium mb-1 text-gray-700">
            Rarity
          </label>
          <select
            id="rarity"
            name="rarity"
            value={filters.rarity}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Rarities</option>
            {[0, 1, 2].map(rarity => (
              <option key={rarity} value={rarity}>
                {getRarityName(rarity)}
              </option>
            ))}
          </select>
        </div>
        
        {/* Price range */}
        <div>
          <label htmlFor="minPrice" className="block text-sm font-medium mb-1 text-gray-700">
            Min Price (Wei)
          </label>
          <input
            id="minPrice"
            name="minPrice"
            type="number"
            value={filters.minPrice}
            onChange={handleChange}
            min="0"
            step="0.001"
            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="0"
          />
        </div>
        
        <div>
          <label htmlFor="maxPrice" className="block text-sm font-medium mb-1 text-gray-700">
            Max Price (Wei)
          </label>
          <input
            id="maxPrice"
            name="maxPrice"
            type="number"
            value={filters.maxPrice}
            onChange={handleChange}
            min="0"
            step="0.001"
            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="No limit"
          />
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-0 mt-4">
        {/* Sort options */}
        <div className="w-full md:basis-1/2 md:pr-2">
          <label htmlFor="sortBy" className="block text-sm font-medium mb-1 text-gray-700">
            Sort By
          </label>
          <select
            id="sortBy"
            name="sortBy"
            value={filters.sortBy}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="idUp">ID: Low to High</option>
            <option value="idDown">ID: High to Low</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
          </select>
        </div>
        <div className="w-full md:basis-1/4 md:px-2">
          <div className="grid grid-cols-1 gap-1">
            {/* Auction filter */}
            <div className="flex items-center">
              <input
                id="showAuction"
                name="showAuction"
                type="checkbox"
                checked={filters.showAuction}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="showAuction" className="ml-2 block text-sm text-gray-700">
                Show auctions
              </label>
            </div>
            {/* Fixed price filter */}
            <div className="flex items-center">
              <input
                id="showFixedPrice"
                name="showFixedPrice"
                type="checkbox"
                checked={filters.showFixedPrice}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="showFixedPrice" className="ml-2 block text-sm text-gray-700">
                Show fixed price
              </label>
            </div>
          </div>
        </div>
        {/* Clear filters button */}
        <div className="w-full md:basis-1/4 md:pl-2">
          <button
            onClick={() => onFilterChange({
              type: 'all',
              rarity: 'all',
              minPrice: '',
              maxPrice: '',
              showAuction: true,
              showFixedPrice: true,
              sortBy: 'idUp'
            })}
            className="w-full px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar; 