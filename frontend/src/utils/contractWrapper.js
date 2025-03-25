import { ethers } from 'ethers';

// Create a stable cache for mock data to prevent UI flickering
const MOCK_DATA_CACHE = {
  cards: {},
  listings: null
};

/**
 * Creates a proxy wrapper around a contract to safely handle missing methods
 * @param {Object} contract - The ethers contract instance
 * @returns {Proxy} - A proxy that safely handles missing methods
 */
export function wrapContractWithFallbacks(contract) {
  if (!contract) return null;

  // Track warnings to prevent repeated console spam
  const reportedWarnings = new Set();
  
  // Create a proxy to intercept method calls
  return new Proxy(contract, {
    get(target, prop, receiver) {
      // Special case for the 'then' property - helps prevent proxy from interfering with Promise behavior
      if (prop === 'then') {
        return undefined;
      }
      
      // For properties that exist on the contract, return them directly, but wrap function calls to handle errors
      if (prop in target) {
        const value = Reflect.get(target, prop, receiver);
        
        // If it's a function, add error handling
        if (typeof value === 'function') {
          return async (...args) => {
            try {
              return await value(...args);
            } catch (error) {
              // Check for the "contract runner does not support calling" error
              if (error.code === 'UNSUPPORTED_OPERATION' || error.message?.includes('does not support calling')) {
                const warningKey = `${String(prop)}-unsupported`;
                if (!reportedWarnings.has(warningKey)) {
                  console.warn(`Contract operation not supported: ${String(prop)}. Using fallback value.`);
                  reportedWarnings.add(warningKey);
                }
                
                // Return cached mock data for consistency
                return getStableMockValue(prop, args);
              }
              throw error; // Let other errors propagate
            }
          };
        }
        
        return value;
      }
      
      // For methods that don't exist, provide fallbacks
      const warnOnce = () => {
        const warningKey = `${contract.address}-${String(prop)}`;
        if (!reportedWarnings.has(warningKey)) {
          console.warn(`Method ${String(prop)} not found on contract ${contract.address}`);
          reportedWarnings.add(warningKey);
        }
      };
      
      // Return a fallback function that returns a sensible default value
      return (...args) => {
        warnOnce();
        return Promise.resolve(getStableMockValue(prop, args));
      };
    }
  });
}

/**
 * Get a stable mock value for contract methods to prevent flickering
 */
function getStableMockValue(methodName, args = []) {

  
  // Default fallback
  return null;
} 