// Consolidated utilities for the application

// Formatting Functions

// Format an Ethereum address for display (e.g., 0x123...abcd)
export const formatAddress = address => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Format wei price into ETH/Gwei/Wei for display
export const formatEth = (amount, decimals = 4) =>
  (amount >= 1000000000000000000.0) ? `${(parseFloat(amount)/1000000000000000000.0).toFixed(decimals)} ETH` :
  ((amount >= 1000000000) ?           `${(parseFloat(amount)/1000000000).toFixed(decimals)} Gwei` :
                                      `${(parseFloat(amount))} Wei`);

// Get network name from chain ID
export const getNetworkName = (chainId) => {
  const networks = {
    1: 'Ethereum Mainnet',
    3: 'Ropsten Testnet',
    4: 'Rinkeby Testnet',
    5: 'Goerli Testnet',
    42: 'Kovan Testnet',
    56: 'Binance Smart Chain',
    137: 'Polygon Mainnet',
    31337: 'Localhost', // Hardhat Network often uses this
    80001: 'Polygon Mumbai',
    11155111: 'Sepolia'
  };

  return networks[Number(chainId)] || `Chain ID ${chainId}`;
};

// Format date from UNIX timestamp
export const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString();
};

// Calculate and format time remaining from UNIX timestamp
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

// Rarity Helpers

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

// Return appropriate CSS class for rarity level
export const getRarityClass = rarity => RARITY_CLASSES[rarity];

// Convert rarity number to display name
export const getRarityName = rarity => RARITY_NAMES[rarity];

export const RARITIES = Object.values(RARITY_NAMES);

// Helper for conditionally joining CSS classes
export const classNames = (...classes) => classes.filter(Boolean).join(' ');

// Other Utilities
export * from './mockData';
export * from './diagnostics';
export * from './getPokemonImageUrl'; 