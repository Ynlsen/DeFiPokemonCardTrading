/**
 * Mock data utilities for development and testing purposes
 * This helps provide a fallback when contract data is unavailable
 */

import { ethers } from 'ethers';
import { getPokemonImageUrl } from './getPokemonImageUrl';


// Module-level cache to maintain consistent mock data across renders
const STABLE_MOCK_CACHE = {
  cards: {},
  getForTokenId: (tokenId) => {
    // Create stable entry if it doesn't exist
    if (!STABLE_MOCK_CACHE.cards[tokenId]) {
      const pokemonId = ((tokenId * 13) % 150) + 1; // Deterministic but varied
      const rarity = (tokenId * 7) % 3;             // Deterministic rarity
      const addressSuffix = tokenId.toString().padStart(4, '0');
      
      STABLE_MOCK_CACHE.cards[tokenId] = {
        tokenId: Number(tokenId),
        pokemonId: pokemonId,
        rarity: rarity,
        owner: `0x${'1'.repeat(36)}${addressSuffix}`,
        types: ['normal', tokenId % 3 === 0 ? 'fire' : (tokenId % 2 === 0 ? 'water' : 'electric')],
        estimatedValue: ethers.parseEther(((rarity + 1) * 0.01).toString()).toString(),
        listing: tokenId % 4 === 0 ? {
          tokenId: Number(tokenId),
          seller: `0x${'2'.repeat(36)}${addressSuffix}`,
          price: ethers.parseEther(((rarity + 1) * 0.05).toString()).toString(),
          isAuction: tokenId % 8 === 0,
          isActive: true,
          highestBidder: `0x${'3'.repeat(36)}${addressSuffix}`,
          highestBid: ethers.parseEther('0.02').toString(),
          endTime: Date.now() + 86400000, // 1 day from now
          listingTime: Date.now() - (tokenId * 60000) // Staggered listing times
        } : null
      };
    }
    
    return STABLE_MOCK_CACHE.cards[tokenId];
  }
};

/**
 * Generate mock card data for a specific token ID
 * @param {number} tokenId - Token ID to generate data for
 * @returns {Object} Mock card data
 */
export const generateMockCard = (tokenId) => {
  return STABLE_MOCK_CACHE.getForTokenId(tokenId);
};

/**
 * Generate multiple mock cards
 * @param {number} count - Number of cards to generate
 * @returns {Array} Array of mock cards
 */
export const generateMockCards = (count = 10) => {
  return Array.from({ length: count }, (_, index) => {
    const tokenId = index + 1;
    return STABLE_MOCK_CACHE.getForTokenId(tokenId);
  });
};

/**
 * Generate a mock listing for a token
 * @param {number} tokenId - Token ID to generate listing for
 * @returns {Object} Mock listing data
 */
export const generateMockListing = (tokenId) => {
  const card = STABLE_MOCK_CACHE.getForTokenId(tokenId);
  
  // If this token already has a listing, return it
  if (card.listing) {
    return card.listing;
  }
  
  // Otherwise create a new stable listing
  const isAuction = tokenId % 5 === 0;
  const rarity = card.rarity;
  const price = ethers.parseEther(((rarity + 1) * 0.05).toString()).toString();
  const addressSuffix = tokenId.toString().padStart(4, '0');
  
  return {
    tokenId: Number(tokenId),
    seller: `0x${'2'.repeat(36)}${addressSuffix}`,
    price: price,
    isAuction: isAuction,
    isActive: true,
    highestBidder: isAuction ? `0x${'3'.repeat(36)}${addressSuffix}` : '0x0000000000000000000000000000000000000000',
    highestBid: isAuction ? ethers.parseEther('0.02').toString() : '0',
    endTime: isAuction ? Date.now() + 86400000 : 0,
    listingTime: Date.now() - (tokenId * 60000) // Staggered listing times
  };
};

// Export functions
export default {
  generateMockCard,
  generateMockCards,
  generateMockListing
}; 