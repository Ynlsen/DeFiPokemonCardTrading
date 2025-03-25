/**
 * Utility functions for diagnosing contract connectivity issues
 */

/**
 * Checks for required environment variables
 * @returns {Object} Object containing environment variable status
 */
const checkEnvironmentVariables = () => {
  try {
    console.log('Checking environment variables...');
    
    // Check for contract addresses and API key
    const tokenAddress = import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS;
    const tradingAddress = import.meta.env.VITE_TRADING_CONTRACT_ADDRESS;
    const etherscanApiKey = import.meta.env.VITE_ETHERSCAN_API_KEY;
    
    return {
      hasTokenAddress: !!tokenAddress,
      hasTradingAddress: !!tradingAddress,
      hasEtherscanApiKey: !!etherscanApiKey,
      tokenAddress: tokenAddress || 'Not set',
      tradingAddress: tradingAddress || 'Not set',
      etherscanApiKey: etherscanApiKey ? 'Set (hidden)' : 'Not set'
    };
  } catch (error) {
    console.error('Error checking environment variables:', error);
    return {
      hasTokenAddress: false,
      hasTradingAddress: false,
      hasEtherscanApiKey: false,
      error: error.message
    };
  }
};

/**
 * Run a series of diagnostics on contracts and wallet connection
 * @param {Object} contracts - Object containing contract instances
 * @param {Object} wallet - Object containing wallet info
 * @param {Function} getEnvVars - Function to get environment variables
 * @returns {Object} Diagnostic results
 */
export const runContractDiagnostics = async (contracts = {}, wallet = {}, getEnvVars = () => ({})) => {
  const results = {
    timestamp: new Date().toISOString(),
    environment: import.meta.env.MODE || 'unknown',
    wallet: {
      connected: !!wallet?.account,
      address: wallet?.account || 'Not connected',
      chainId: wallet?.chainId || 'Unknown',
      networkName: wallet?.networkName || 'Unknown',
    },
    tokenContract: {
      name: null,
      initialized: false,
      canCall: false,
      errors: [],
    },
    tradingContract: {
      initialized: false,
      canCall: false,
      errors: [],
    },
    envVars: checkEnvironmentVariables()
  };

  // Check token contract
  if (contracts?.tokenContract) {
    results.tokenContract.initialized = true;
    
    try {
      // Try to call simple view function
      const name = await contracts.tokenContract.name();
      results.tokenContract.name = name;
      results.tokenContract.canCall = true;
    } catch (error) {
      results.tokenContract.errors.push(error?.message || 'Unknown error calling name()');
    }

    try {
      // Check if supports ERC721 interface
      const supportsERC721 = await contracts.tokenContract.supportsInterface('0x80ac58cd');
      results.tokenContract.supportsERC721 = supportsERC721;
    } catch (error) {
      results.tokenContract.errors.push(`supportsInterface check failed: ${error?.message || 'Unknown error'}`);
    }
  }

  // Check trading contract
  if (contracts?.tradingContract) {
    results.tradingContract.initialized = true;
    
    try {
      // Try to call simple view function
      const listingCount = await contracts.tradingContract.listings(0);
      results.tradingContract.canCall = true;
    } catch (error) {
      results.tradingContract.errors.push(error?.message || 'Unknown error calling getListingCount()');
    }
  }

  return results;
};

/**
 * Format diagnostic results as human-readable text
 * @param {Object} results - Diagnostic results from runContractDiagnostics
 * @returns {String} Formatted diagnostic results
 */
export const formatDiagnosticResults = (results) => {
  if (!results) return 'No diagnostic results available';

  return `
==== Contract Diagnostic Results ====
Timestamp: ${results.timestamp}
Environment: ${results.environment}

WALLET CONNECTION:
- Connected: ${results.wallet.connected ? 'Yes' : 'No'}
- Address: ${results.wallet.address}
- Chain ID: ${results.wallet.chainId}
- Network: ${results.wallet.networkName}

TOKEN CONTRACT:
- Name: ${results.tokenContract.name || 'Not initialized'}
- Initialized: ${results.tokenContract.initialized ? 'Yes' : 'No'}
- Can Call Functions: ${results.tokenContract.canCall ? 'Yes' : 'No'}
${results.tokenContract.supportsERC721 !== undefined ? `- Supports ERC721: ${results.tokenContract.supportsERC721 ? 'Yes' : 'No'}` : ''}
${results.tokenContract.errors && results.tokenContract.errors.length > 0 ? `- Errors: ${results.tokenContract.errors.join(', ')}` : ''}

TRADING CONTRACT:
- Initialized: ${results.tradingContract.initialized ? 'Yes' : 'No'}
- Can Call Functions: ${results.tradingContract.canCall ? 'Yes' : 'No'}
${results.tradingContract.listingCount !== undefined ? `- Listing Count: ${results.tradingContract.listingCount}` : ''}
${results.tradingContract.errors && results.tradingContract.errors.length > 0 ? `- Errors: ${results.tradingContract.errors.join(', ')}` : ''}

ENVIRONMENT VARIABLES:
- Token Contract: ${results.envVars.tokenAddress}
- Trading Contract: ${results.envVars.tradingAddress}
- Etherscan API Key: ${results.envVars.etherscanApiKey}
${results.envVars.error ? `- Error: ${results.envVars.error}` : ''}

DEVELOPMENT MODE:
${import.meta.env.MODE === 'development' ? '- Mock data is available when contracts are not connected' : '- Production mode'}
`;
}; 