import React, { createContext, useReducer, useEffect, useCallback, useContext } from 'react';
import { ethers } from 'ethers';
import { produce } from 'immer';
import { generateMockCards, generateMockCard } from '../utils/mockData';
import { runContractDiagnostics, formatDiagnosticResults } from '../utils/diagnostics';
import { wrapContractWithFallbacks } from '../utils/contractWrapper';

// Import ABIs and contract addresses
import PokemonCardTokenABI from '../contracts/PokemonCardToken.json';
import PokemonCardTradingABI from '../contracts/PokemonCardTrading.json';

// Create a single context for the entire application
const AppContext = createContext({
  wallet: {
    account: null,
    chainId: null,
    networkName: null,
    isConnecting: false
  },
  contracts: {
    tokenContract: null,
    tradingContract: null
  },
  pokemonData: {
    data: {},
    loading: {},
    errors: {}
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
    isConnecting: false
  },
  contracts: {
    tokenContract: null,
    tradingContract: null
  },
  pokemonData: {
    data: {},
    loading: {},
    errors: {}
  }
};

// Action types for state updates
const actions = {
  wallet: {
    CONNECT_START: 'wallet/connect-start',
    CONNECT_SUCCESS: 'wallet/connect-success',
    CONNECT_ERROR: 'wallet/connect-error',
    DISCONNECT: 'wallet/disconnect',
    UPDATE: 'wallet/update'
  },
  contracts: {
    INIT_START: 'contracts/init-start',
    INIT_SUCCESS: 'contracts/init-success',
    INIT_ERROR: 'contracts/init-error',
    UPDATE: 'contracts/update'
  },
  pokemon: {
    FETCH_START: 'pokemon/fetch-start',
    FETCH_SUCCESS: 'pokemon/fetch-success',
    FETCH_ERROR: 'pokemon/fetch-error'
  }
};

// Reducer function for handling state updates
const appReducer = (state, action) => {
  switch (action.type) {
    // Wallet actions
    case actions.wallet.CONNECT_START:
      return produce(state, draft => {
        draft.wallet.isConnecting = true;
      });
      
    case actions.wallet.CONNECT_SUCCESS:
      return produce(state, draft => {
        Object.assign(draft.wallet, action.payload);
        draft.wallet.isConnecting = false;
      });
      
    case actions.wallet.CONNECT_ERROR:
      return produce(state, draft => {
        draft.wallet.isConnecting = false;
        draft.wallet.error = action.payload;
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
    case actions.contracts.INIT_START:
      return produce(state, draft => {
        draft.contracts.loading = true;
        draft.contracts.error = null;
      });
      
    case actions.contracts.INIT_SUCCESS:
      return produce(state, draft => {
        Object.assign(draft.contracts, action.payload);
        draft.contracts.loading = false;
        draft.contracts.error = null;
      });
      
    case actions.contracts.INIT_ERROR:
      return produce(state, draft => {
        draft.contracts.loading = false;
        draft.contracts.error = action.payload;
        draft.contracts.tokenContract = null;
        draft.contracts.tradingContract = null;
      });
      
    case actions.contracts.UPDATE:
      return produce(state, draft => {
        Object.assign(draft.contracts, action.payload);
      });
      
    // Pokemon data actions
    case actions.pokemon.FETCH_START:
      return produce(state, draft => {
        draft.pokemonData.loading[action.payload] = true;
        draft.pokemonData.errors[action.payload] = null;
      });
      
    case actions.pokemon.FETCH_SUCCESS:
      return produce(state, draft => {
        draft.pokemonData.data[action.payload.id] = action.payload.data;
        draft.pokemonData.loading[action.payload.id] = false;
        draft.pokemonData.errors[action.payload.id] = null;
      });
      
    case actions.pokemon.FETCH_ERROR:
      return produce(state, draft => {
        draft.pokemonData.loading[action.payload.id] = false;
        draft.pokemonData.errors[action.payload.id] = action.payload.error;
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
  
  // Helper to get network name from chain ID
  const getNetworkName = (chainId) => {
    const networks = {
      1: 'Ethereum Mainnet',
      3: 'Ropsten Testnet',
      4: 'Rinkeby Testnet',
      5: 'Goerli Testnet',
      42: 'Kovan Testnet',
      56: 'Binance Smart Chain',
      137: 'Polygon Mainnet',
      80001: 'Polygon Mumbai',
      11155111: 'Sepolia'
    };
    
    return networks[chainId] || `Chain ID ${chainId}`;
  };

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
      
      // Wrap with proxy to handle missing methods gracefully
      const wrappedTokenContract = wrapContractWithFallbacks(tokenContract);
      const wrappedTradingContract = wrapContractWithFallbacks(tradingContract);
      
      // Update state with wrapped contracts
      dispatch({ 
        type: actions.contracts.INIT_SUCCESS, 
        payload: { 
          tokenContract: wrappedTokenContract, 
          tradingContract: wrappedTradingContract,
          tokenAddress,
          tradingAddress
        }
      });
      
      return {
        tokenContract: wrappedTokenContract,
        tradingContract: wrappedTradingContract,
        tokenAddress,
        tradingAddress
      };
    } catch (error) {
      console.error('AAAAAAA',error)
      dispatch({ 
        type: actions.contracts.INIT_ERROR, 
        payload: error.message
      });
      return null;
    }
  };

  // Setup wallet event listeners - defining before connectWallet to avoid circular dependency
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

  // Connect wallet function - now setupWalletEventListeners and initializeContracts have already been defined
  const connectWallet = async () => {
    dispatch({ type: actions.wallet.CONNECT_START });

    try {
      if (!window.ethereum) throw new Error('MetaMask not installed');

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const networkName = getNetworkName(chainId);
      console.log(account);
      dispatch({
        type: actions.wallet.CONNECT_SUCCESS,
        payload: { account, provider, signer, chainId, networkName }
      });
      
      await initializeContracts(provider);
      setupWalletEventListeners();
      
      return { account, provider, signer };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      dispatch({ 
        type: actions.wallet.CONNECT_ERROR, 
        payload: error.message
      });
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
          type: actions.contracts.UPDATE,
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


  // Simplified executeTransaction - removes redundant error handling
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
  }, [state.contracts]);

  // Get owned tokens - simplified to avoid using tokenOfOwnerByIndex which doesn't exist
  const getOwnedTokens = useCallback(async (ownerAddress = state.wallet.account) => {
    try {
      if (!state.contracts.tokenContract) throw new Error('Token contract not initialized');
      
      const balance = await state.contracts.tokenContract.balanceOf(ownerAddress);
      
      // Since we don't have a way to enumerate tokens directly,
      // we'll return the balance indicating how many tokens the user owns
      return {
        balance: Number(balance),
        ownerAddress
      };
    } catch (err) {
      console.error('Failed to get owned tokens', err);
      return { balance: 0, ownerAddress }; // Return default on error
    }
  }, [state.contracts.tokenContract, state.wallet.account]);

  /**
   * Get detailed card data by token ID
   * @param {number} tokenId - Token ID to get card data for
   * @returns {Promise<Object>} Card data 
   */
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
      // TODO test performance for larger numbers!
      // For production, check 20 token IDs and see which ones are listed
      const maxTokensToCheck = 20;
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


  // Simplified fetch and format Pokemon data
  const fetchPokemonData = useCallback(async (pokemonId) => {
    const isDev = import.meta.env.MODE === 'development' || window.location.hostname === 'localhost';

    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      const data = await response.json();

      const typeId = data.types.map(type => (type.type.url).substr(31).slice(0,-1));


      console.log(typeId);


      
   
      console.log(typeId);


      
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

  // Simplified getPokemonData with cache
  const getPokemonData = useCallback(async (pokemonId) => {
    const isDev = import.meta.env.MODE === 'development' || window.location.hostname === 'localhost';
    
    if (!pokemonId || pokemonId < 1 ||  pokemonId > 151) {
      console.error(`Failed to load Pokemon Data (Not in Range 1-151)`);
      return null;
    }

    try {
      const data = await fetchPokemonData(pokemonId);
      return data;
    } catch (err) {
      console.error(`Failed to load Pokemon #${pokemonId}:`, err);
      return null;
    }
  }, []);

  // Simplified format address
  const formatAddress = address => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get data for all listed cards
  const getAllListedCards = useCallback(async () => {
    
    try {

      const tokenIds = await getAllListings();

      
      // Get card data for each token ID
      const cards = await Promise.all(
        tokenIds.map(tokenId => getCardData(tokenId))
      );
      return cards;

    } catch (error) {

      console.warn('Error fetching marketplace listings:', error);
      return null;
    }
  }, [getAllListings, getCardData]);


  // Get cards owned by the current account - optimized to prevent flickering
  const getOwnedCards = useCallback(async () => {
    const isDev = import.meta.env.MODE === 'development';       

    // Return empty array if no account
    if (!state.wallet.account) {
      return [];
    }

    try {

      // Get balance from token contract
      const balance = await state.contracts.tokenContract.balanceOf(state.wallet.account);
      
      // Missing tokenOfOwnerByIndex function in contract TODO: Implement

      // Filter out null results
      const validCards = [];
      
      if(isDev && validCards.length == 0){
        return generateMockCards(5);
      }
      return validCards;
    } catch (error) {
      console.error('Error getting owned cards:', error);
      
      // Return mock data in development
      if (isDev) {
        return generateMockCards(5);
      }
      
      return [];
    }
  }, [state.wallet.account, state.contracts.tokenContract, getCardData]);

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

  // Clean up contextValue export
  const contextValue = {
    // State
    wallet: state.wallet,
    contracts: state.contracts,
    pokemonData: state.pokemonData,
    
    // Core functionality
    init,
    connectWallet,
    disconnectWallet,
    formatAddress,
    
    // Token operations
    getOwnedTokens,
    getCardData,
    
    // Marketplace operations
    listCardForSale,
    createAuction,
    buyCard,
    placeBid,
    cancelListing,
    endAuction,
    
    // Data retrieval
    getPokemonData,
    getAllListings,
    getListingDetails,
    getOwnedCards,
    getAllListedCards,

    // Account shorthand
    account: state.wallet?.account || null,
    isConnecting: state.wallet?.isConnecting || false,

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