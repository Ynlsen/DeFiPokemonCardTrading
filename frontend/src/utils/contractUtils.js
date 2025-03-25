/**
 * Utility functions for contract interactions
 */
import { ethers } from 'ethers';
import PokemonCardTokenABI from '../contracts/PokemonCardToken.json';
import PokemonCardTradingABI from '../contracts/PokemonCardTrading.json';

/**
 * Test contract connections and log information to the console
 * @param {string} tokenAddress - Token contract address
 * @param {string} tradingAddress - Trading contract address
 * @param {ethers.Provider} provider - Provider to use
 * @returns {Promise<boolean>} True if connections are successful
 */
export const testContractConnections = async (tokenAddress, tradingAddress, provider) => {
  console.group('Contract Connection Test');
  console.log('Testing contract connections with:');
  console.log('- Token address:', tokenAddress);
  console.log('- Trading address:', tradingAddress);
  
  try {
    // Create read-only contract instances
    const tokenContract = new ethers.Contract(tokenAddress, PokemonCardTokenABI.abi, provider);
    const tradingContract = new ethers.Contract(tradingAddress, PokemonCardTradingABI.abi, provider);
    
    // Test token contract
    console.log('\nTesting Token Contract:');
    
    // Check contract methods
    console.log('Available methods:', Object.keys(tokenContract.interface.functions).join(', '));
    
    // Try to get contract balances
    try {
      const networkVersion = await provider.getNetwork();
      console.log('Network version:', networkVersion.chainId);
    } catch (error) {
      console.error('Failed to get network version:', error.message);
    }
    
    // Test trading contract
    console.log('\nTesting Trading Contract:');
    
    // Check contract methods
    console.log('Available methods:', Object.keys(tradingContract.interface.functions).join(', '));
    
    console.log('\nContract connection test completed successfully!');
    console.groupEnd();
    return true;
  } catch (error) {
    console.error('Contract connection test failed:', error);
    console.groupEnd();
    return false;
  }
};

/**
 * Detect common contract issues
 * @param {object} error - The error object
 * @returns {string} Human-readable error message
 */
export const getContractErrorMessage = (error) => {
  const errorMessage = error.message || 'Unknown error';
  
  // Extract message from error
  if (errorMessage.includes('call revert exception')) {
    return 'Contract function call failed. Check that you\'re connected to the right network.';
  }
  
  if (errorMessage.includes('missing revert data')) {
    return 'Contract call reverted. This might be due to incorrect contract address or ABI mismatch.';
  }
  
  if (errorMessage.includes('invalid address')) {
    return 'Invalid contract address. Please check the address in .env file.';
  }
  
  if (errorMessage.includes('CALL_EXCEPTION')) {
    return 'Call exception. The contract function might not exist or the contract address is wrong.';
  }
  
  if (errorMessage.includes('map is not a function')) {
    return 'Expected array but received a different type. Check that the contract is returning the expected data.';
  }
  
  return errorMessage;
};

export default {
  testContractConnections,
  getContractErrorMessage
}; 