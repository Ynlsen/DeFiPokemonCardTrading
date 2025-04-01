/**
 * Consolidated utilities for the application
 */

// Import and re-export the LoadingSpinner component
export { default as LoadingSpinner } from '../components/common/LoadingSpinner';

/**
 * Format an Ethereum address for display
 * @param {string} address - Ethereum address to format
 * @param {number} [prefixLen=6] - Number of characters to show at start
 * @param {number} [suffixLen=4] - Number of characters to show at end
 * @returns {string} Formatted address
 */
export const formatAddress = (address, prefixLen = 6, suffixLen = 4) => 
  !address ? '' : 
  address.length < (prefixLen + suffixLen + 3) ? address : 
  `${address.slice(0, prefixLen)}...${address.slice(-suffixLen)}`;

// Format wei price into gwei or eth depending on the amount
export const formatEth = (amount, decimals = 4) => 
  (amount >= 1000000000000000000.0) ? `${(parseFloat(amount)/1000000000000000000.0).toFixed(decimals)} ETH` : 
  ((amount >= 1000000000) ?           `${(parseFloat(amount)/1000000000).toFixed(decimals)} Gwei` :
                                      `${(parseFloat(amount))} Wei`);

/**
 * Format date from UNIX timestamp
 * @param {number} timestamp - UNIX timestamp (seconds)
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString();
};

/**
 * Calculate and format time remaining
 * @param {number} endTime - End time as UNIX timestamp (seconds)
 * @returns {string} Formatted time remaining
 */
export const formatTimeRemaining = (endTime) => {
  if (!endTime) return 'N/A';
  
  const now = Math.floor(Date.now() / 1000);
  const timeLeft = endTime - now;
  
  if (timeLeft <= 0) return 'Ended';
  
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} left`;
  }
  
  return hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
};

/**
 * Rarity mapping
 */
const RARITY_CLASSES = {
  0: 'bg-gray-200 text-gray-700',     // Common
  1: 'bg-blue-200 text-blue-700',     // Rare
  2: 'bg-purple-200 text-purple-700', // Epic
};

const RARITY_NAMES = {
  0: 'Common',
  1: 'Rare', 
  2: 'Epic',
};

/**
 * Return appropriate CSS class for rarity level
 * @param {number} rarity - Rarity level (0-2)
 * @returns {string} CSS class name
 */
export const getRarityClass = rarity => RARITY_CLASSES[rarity];

/**
 * Convert rarity number to display name
 * @param {number} rarity - Rarity level (0-2)
 * @returns {string} Rarity name
 */
export const getRarityName = rarity => RARITY_NAMES[rarity];

/**
 * Helper for conditionally joining CSS classes
 * @param  {...string} classes - CSS classes to join
 * @returns {string} Joined class string
 */
export const classNames = (...classes) => classes.filter(Boolean).join(' ');

// Export RARITIES from the constants for use in components
export const RARITIES = Object.values(RARITY_NAMES);

// Export all utility functions
export * from './mockData';
export * from './diagnostics';
export * from './contractWrapper';
export { getPokemonImageUrl } from './getPokemonImageUrl'; 