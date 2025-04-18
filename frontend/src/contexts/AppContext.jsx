import React, { createContext, useReducer, useEffect, useCallback, useContext } from 'react';
import { ethers } from 'ethers';
import { produce } from 'immer';
import { generateMockCard } from '../utils/mockData';
import { runContractDiagnostics, formatDiagnosticResults } from '../utils/diagnostics';
import { getNetworkName } from '../utils';

// Import ABIs and contract addresses
import PokemonCardTokenABI from '../contracts/PokemonCardToken.json';
import PokemonCardTradingABI from '../contracts/PokemonCardTrading.json';

// Create a single context for the entire application
const AppContext = createContext({
  wallet: {
    account: null,
    chainId: null,
    networkName: null,
  },
  contracts: {
    tokenContract: null,
    tradingContract: null
  },
  init: () => {},
  connectWallet: () => {},
  disconnectWallet: () => {}
});

// Initial state with defaults for all values
const initialState = {
  wallet: {
    provider: null,
    signer: null,
    account: null,
    chainId: null,
    networkName: null,
  },
  contracts: {
    tokenContract: null,
    tradingContract: null
  }
};

// Action types for state updates
const actions = {
  wallet: {
    CONNECT_SUCCESS: 'wallet/connect-success',
    DISCONNECT: 'wallet/disconnect',
    UPDATE: 'wallet/update'
  },
  contracts: {
    INIT_SUCCESS: 'contracts/init-success',
  },
};

// Reducer function for handling state updates
const appReducer = (state, action) => {
  switch (action.type) {
    // Wallet actions
    case actions.wallet.CONNECT_SUCCESS:
      return produce(state, draft => {
        Object.assign(draft.wallet, action.payload);
      });
      
    case actions.wallet.DISCONNECT:
      return produce(state, draft => {
        draft.wallet = initialState.wallet;
        draft.contracts = initialState.contracts;
      });
      
    case actions.wallet.UPDATE:
      return produce(state, draft => {
        Object.assign(draft.wallet, action.payload);
      });
      
    // Contract actions
    case actions.contracts.INIT_SUCCESS:
      return produce(state, draft => {
        Object.assign(draft.contracts, action.payload);
      });
      
    default:
      return state;
  }
};

/**
 * AppProvider component - A consolidated provider for all app state
 */
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Simplified contract initialization
  const initializeContracts = async (provider) => {
    try {
      const tokenAddress = import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS;
      const tradingAddress = import.meta.env.VITE_TRADING_CONTRACT_ADDRESS;
      
      if (!tokenAddress || !tradingAddress) {
        throw new Error('Contract addresses not configured');
      }
      
      const signer = await provider.getSigner();
      const tokenAbi = PokemonCardTokenABI.abi;
      const tradingAbi = PokemonCardTradingABI.abi;
      
      // Create contract instances
      const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
      const tradingContract = new ethers.Contract(tradingAddress, tradingAbi, signer);
      
      // Update state with contracts
      dispatch({ 
        type: actions.contracts.INIT_SUCCESS, 
        payload: { 
          tokenContract, 
          tradingContract,
          tokenAddress,
          tradingAddress
        }
      });
      
      return { tokenContract, tradingContract, tokenAddress, tradingAddress };

    } catch (error) {
      console.error('Contract initialization error:', error);
      return null;
    }
  };

  // Setup wallet event listeners 
  const setupWalletEventListeners = useCallback(() => {
    if (!window.ethereum) return;
    
    // Handler for account changes
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        dispatch({ type: actions.wallet.DISCONNECT });
        console.log('Wallet disconnected');
      } else {
        // Account changed, update state
        dispatch({
          type: actions.wallet.UPDATE,
          payload: { account: accounts[0] }
        });
        console.log('Wallet account changed:', accounts[0]);
      }
    };
    
    // Handler for chain (network) changes
    const handleChainChanged = async (chainIdHex) => {
      const chainId = Number(chainIdHex);
      const networkName = getNetworkName(chainId);
      
      dispatch({
        type: actions.wallet.UPDATE,
        payload: { chainId, networkName }
      });
      
      console.log('Network changed:', { chainId, networkName });
      
      // Refresh page as recommended by MetaMask
      window.location.reload();
    };
    
    // Register event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', () => {
      dispatch({ type: actions.wallet.DISCONNECT });
      console.log('Wallet disconnected');
    });
    
    // Return cleanup function
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener('disconnect', () => {});
    };
  }, []);

  // Connect wallet function 
  const connectWallet = async () => {
    try {
      if (!window.ethereum) throw new Error('MetaMask not installed');

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const networkName = getNetworkName(chainId);
      console.log('Connected account:', account);

      dispatch({
        type: actions.wallet.CONNECT_SUCCESS,
        payload: { account, provider, signer, chainId, networkName }
      });
      
      await initializeContracts(provider);
      setupWalletEventListeners();
      
      return { account, provider, signer };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return null;
    }
  };

  // Initialize the application
  const init = useCallback(async () => {
    try {
      // Check if user is already connected via MetaMask
      if (window.ethereum && window.ethereum.selectedAddress) {
        await connectWallet();
      }
    } catch (error) {
      console.error('Error during initialization:', error);
      
      // Make sure we have a valid contracts object even if initialization fails
      if (!state.contracts) {
        dispatch({
          type: actions.contracts.INIT_SUCCESS,
          payload: { tokenContract: null, tradingContract: null }
        });
      }
    }
  }, [connectWallet]);

  // Call init on component mount
  useEffect(() => {
    const initialize = async () => {
      try {
        await init();
        console.log('App initialized');
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };
    
    initialize();
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    dispatch({ type: actions.wallet.DISCONNECT });
  }, []);

  const executeTransaction = useCallback(async (txFn, errorMsg) => {
    try {
      const tx = await txFn();
      await tx.wait();
      return true;
    } catch (err) {
      console.error(errorMsg, err);
      return false;
    }
  }, []);

  // Simplified approveAndExecute
  const approveAndExecute = useCallback(async (tokenId, txFn, errorMsg) => {
    try {
      const { tokenContract, tradingContract } = state.contracts;
      if (!tradingContract || !tokenContract) {
        throw new Error('Contracts not initialized');
      }

      // Approve the trading contract to transfer the token
      const approveTx = await tokenContract.approve(
        import.meta.env.VITE_TRADING_CONTRACT_ADDRESS, 
        tokenId
      );
      await approveTx.wait();

      // Execute the specific transaction
      const tx = await txFn();
      await tx.wait();
      
      return true;
    } catch (error) {
      console.error(errorMsg, error);
      return false;
    }
  }, [state.contracts.tradingContract, state.contracts.tokenContract]);

  // Get card data  
  const getCardData = async (tokenId) => {
    const isDev = import.meta.env.MODE === 'development';

    try {
      
      const cardData = await state.contracts.tokenContract.getPokemonCard(tokenId);

      const owner = await state.contracts.tokenContract.ownerOf(tokenId);

      const listing = await getListingDetails(tokenId);

      return {
        tokenId: tokenId,
        pokemonId: cardData.pokemonId,
        rarity: cardData.rarity,
        owner: owner,
        listing: listing 
      };
    } catch (error) {
      console.error(`Error fetching card data for token ${tokenId}:`, error);
      return isDev ? generateMockCard(tokenId) : null;
    }
  };

  // List card for fixed price sale
  const listCardForSale = useCallback(async (tokenId, price) => {
    return approveAndExecute(
      tokenId,
      async () => {

        const tx = await state.contracts.tradingContract.listCardForSale(tokenId, price);
        
        return tx;
      },
      'Failed to list card for sale'
    );
  }, [state.contracts.tradingContract, approveAndExecute]);

  // Create an auction
  const createAuction = useCallback(async (tokenId, startingPrice, duration) => {
    return approveAndExecute(
      tokenId,
      async () => {

        const tx = await state.contracts.tradingContract.listCardForAuction(tokenId, startingPrice, duration);
        
        return tx;
      },
      'Failed to create auction'
    );
  }, [state.contracts.tradingContract, approveAndExecute]);

  // Function calls contract to buy a specific token for a specific price (expects price in Wei)
  const buyCard = useCallback(async (tokenId, priceWei) => {
    return executeTransaction(async () => {
      return state.contracts.tradingContract.buyCard(tokenId, { 
        value: priceWei
      });
    }, 'Failed to buy card');
  }, [state.contracts.tradingContract, executeTransaction]);

  // Place bid (expects bidAmount in Wei)
  const placeBid = useCallback(async (tokenId, bidAmount) => {
    return executeTransaction(async () => {
      return state.contracts.tradingContract.placeBid(tokenId, { 
        value: bidAmount 
      });
    }, 'Failed to place bid');
  }, [state.contracts.tradingContract, executeTransaction]);

  // Get all listings
  const getAllListings = useCallback(async () => {
    const isDev = import.meta.env.MODE === 'development';
    
    try {
      // In production, check 10000 token IDs for listings to prevent performance issues.
      const maxTokensToCheck = 10000;
      const listedTokenIds = [];
      
      for (let i = 0; i < maxTokensToCheck; i++) {
        try {
          // Check if token exists first
          await state.contracts.tokenContract.ownerOf(i);
          // Then check if it's listed
          const listing = await state.contracts.tradingContract.listings(i);
          if (listing.active) {
            listedTokenIds.push(i);
          }
        } catch (err) {
          // This probaly means that ownerOf faild which implies thath we have scanned through every token
          break;
        }
      }

      if(isDev && listedTokenIds.length < 1){
        const mockData = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        console.log("Using mock listing IDs for development.");
        return mockData; 
      }
      
      return listedTokenIds;
    } catch (error) {
      console.error("Couldn't get all listings:",error);
      return null;
    }
  }, [state.contracts?.tradingContract]);

  // Get listing details
  const getListingDetails = useCallback(async (tokenId) => {
    // In Dev Mode, the function returns a mock listing if no active listing is found
    const isDev = import.meta.env.MODE === 'development';
    
    try {

      const rawListing = await state.contracts.tradingContract.listings(tokenId);
      
      const listing = {
        tokenId: tokenId,
        seller: rawListing.seller,
        price: rawListing.price.toString(),
        isAuction: rawListing.listingType,
        isActive: rawListing.active,
        highestBidder: rawListing.highestBidder,
        highestBid: rawListing.highestBid.toString(),
        endTime: rawListing.endTime
      };
      if(isDev && !listing.isActive){
        return generateMockListing(tokenId);
      }
      return listing;

    } catch (error) {
      if(isDev){
        return generateMockListing(tokenId);
      }

      console.error('Failed to load listing:', error);
      return null;
    }
  }, [state.contracts.tradingContract]);

  // Helper function to generate a mock listing
  const generateMockListing = (tokenId) => {
    const randomPrice = (Math.random() * 0.1 + 0.05).toFixed(4);
    const isAuction = Math.random() > 0.7;
    const randomAddr = () => `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    
    return {
      tokenId: Number(tokenId),
      seller: randomAddr(),
      price: ethers.parseEther(randomPrice).toString(),
      isAuction,
      isActive: true,
      highestBidder: isAuction ? randomAddr() : '0x0000000000000000000000000000000000000000',
      highestBid: isAuction ? ethers.parseEther((Math.random() * 0.05 + 0.02).toFixed(4)).toString() : '0',
      endTime: isAuction ? (Date.now() / 1000 + Math.floor(Math.random() * 604800)).toString() : '0'
    };
  };

  // Cancel listing
  const cancelListing = useCallback(async (tokenId) => {
    return executeTransaction(async () => {
      return state.contracts.tradingContract.cancelListing(tokenId);
    }, 'Failed to cancel listing');
  }, [state.contracts.tradingContract, executeTransaction]);

  // End Auction
  const endAuction = useCallback(async (tokenId) => {
    return executeTransaction(async () => {
      return state.contracts.tradingContract.endAuction(tokenId);
    }, 'Failed to end auction');
  }, [state.contracts.tradingContract, executeTransaction]);


  // fetch and format Pokemon data
  const getPokemonData = useCallback(async (pokemonId) => {
    const isDev = import.meta.env.MODE === 'development'

    if (!pokemonId || pokemonId < 1 ||  pokemonId > 151) {
      console.error(`Failed to load Pokemon Data (Not in Range 1-151)`);
      return null;
    }

    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      const data = await response.json();

      const typeId = data.types.map(type => (type.type.url).substr(31).slice(0,-1));
  
      return {
        name: data.name,
        types: data.types.map(type => type.type.name),
        typeIds: typeId
      };
    } catch (error) {
      console.error(`Error fetching Pokemon data from PokeAPI for ID ${pokemonId}:`, error);
      if (isDev) {
        return {
          name: `pokemon-${pokemonId}`,
          types: ['normal'],
          typeIds: ['1']
        };
      }
      return null;
    }
  }, []);

  // Get token IDs owned by the current account
  const getOwnedCards = useCallback(async () => {
    const ownerAddress = state.wallet.account;
    const isDev = import.meta.env.MODE === 'development';       

    // Return empty array if no account or contract
    if (!ownerAddress || !state.contracts.tokenContract) {
      return [];
    }

    try {
      const balanceBN = await state.contracts.tokenContract.balanceOf(ownerAddress);
      const balance = Number(balanceBN);

      if (balance === 0) {
        console.log('No owned tokens found. Returning mock IDs.');
        if(isDev){
          return [1, 2, 3, 4, 5, 6];
        }
        return [];
      }

      // Create an array of promises to fetch token IDs
      const tokenIdPromises = [];
      for (let i = 0; i < balance; i++) {
        tokenIdPromises.push(state.contracts.tokenContract.tokenOfOwnerByIndex(ownerAddress, i));
      }
      
      // Resolve all token ID promises
      const tokenIdsRaw = await Promise.all(tokenIdPromises);
      const tokenIds = tokenIdsRaw.map(id => Number(id)); 
      
      return tokenIds;
      
    } catch (error) {
      console.error('Error getting owned token IDs:', error);
      if (isDev) {
          console.warn('Error fetching owned token IDs in dev mode. Returning mock IDs.');
          return [1, 2, 3, 4, 5, 6];
      }
      return [];
    }
  }, [state.wallet.account, state.contracts.tokenContract]);

  /**
   * Run diagnostics on the contract connection
   * @returns {Promise<Object>} Diagnostic results
   */
  const runDiagnostics = useCallback(async () => {
    const contracts = {
      tokenContract: state.contracts.tokenContract,
      tradingContract: state.contracts.tradingContract
    };
    
    const getEnvVars = () => ({
      tokenAddress: import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS || null,
      tradingAddress: import.meta.env.VITE_TRADING_CONTRACT_ADDRESS || null,
      apiKey: import.meta.env.VITE_ETHERSCAN_API_KEY || null,
    });
    
    const results = await runContractDiagnostics(
      contracts, 
      state.wallet,
      getEnvVars
    );
    
    return results;
  }, [state?.contracts?.tokenContract, state?.contracts?.tradingContract, state?.wallet]);

  // Get pending withdrawals for the current user
  const getPendingWithdrawals = useCallback(async (address = state.wallet.account) => {
    if (!state.contracts.tradingContract || !address) {
      console.warn('Trading contract not available or no account connected.');
      return '0'; // Return 0 if contract or account is missing
    }
    try {
      const amount = await state.contracts.tradingContract.pendingWithdrawals(address);
      return amount.toString();
    } catch (error) {
      console.error('Failed to get pending withdrawals:', error);
      return '0';
    }
  }, [state.contracts.tradingContract, state.wallet.account]);

  // Withdraw funds
  const withdrawFunds = useCallback(async () => {
    return executeTransaction(async () => {
      return state.contracts.tradingContract.withdraw();
    }, 'Failed to withdraw funds');
  }, [state.contracts.tradingContract, executeTransaction]);

  // Clean up contextValue export
  const contextValue = {
    // State
    contracts: state.contracts,
    account: state.wallet?.account || null,

    // Core functionality
    init,
    connectWallet,
    disconnectWallet,

    // Marketplace operations
    listCardForSale,
    createAuction,
    buyCard,
    placeBid,
    cancelListing,
    endAuction,
    
    // Data retrieval
    getCardData,
    getPokemonData,
    getAllListings,
    getListingDetails,
    getOwnedCards,

    // Withdrawal functions
    getPendingWithdrawals,
    withdrawFunds,

    // Diagnostics
    runDiagnostics,
    formatDiagnosticResults,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for using the app context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

export default AppProvider; 