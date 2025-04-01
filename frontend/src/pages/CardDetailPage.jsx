import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { formatAddress, formatEth, formatDate, getRarityName, getRarityClass, classNames } from '../utils';
import { getPokemonImageUrl } from '../utils/getPokemonImageUrl';

/**
 * CardDetailPage component - Displays detailed information about a specific card
 */
const CardDetailPage = () => {
  const { tokenId } = useParams();
  const navigate = useNavigate();
  const { 
    contracts, 
    account,
    getCardData,
    getListingDetails, 
    getPokemonData,
    buyCard,
    placeBid,
    cancelListing,
    listCardForSale
  } = useApp() || {};
  
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [price, setPrice] = useState('');
  
  // Format bid input to ensure it's a valid number
  const handleBidAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setBidAmount(value);
  };
  
  // Load card data
  const loadCardData = async () => {
    if (!tokenId) return;

    setLoading(true);
    try {
      
      
      // Get card data using getCardData from context
      const cardData = await getCardData(tokenId);

      if (!cardData) {
        throw new Error('Failed to load card data');
      }
      
      // Get listing details if the card is for sale/auction
      const listing = await getListingDetails(tokenId);
        
      // Get pokemon details from PokeAPI
      const pokemonData = await getPokemonData(cardData.pokemonId);

      // Combine all data into one card object
      setCard({
        tokenId,
        pokemonId: cardData.pokemonId,
        rarity: cardData.rarity,
        owner: cardData.owner,
        name: pokemonData?.name,
        types: pokemonData?.types,
        typeIds: pokemonData?.typeIds,
        listing : listing
      });
    } catch (err) {
      console.error('Error loading card data:', err);
      setError('Failed to load card details. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load card data on mount
  useEffect(() => {
    loadCardData();
  }, [tokenId]);
  
  // Handle card purchase
  const handlePurchase = async () => {
    try {
      setSubmitting(true);
      setError('');
      
      // Use buyCard function directly
      const success = await buyCard(listing.tokenId, listing.price);
      
      if (success) {
        loadCardData();
      } else {
        setError('Transaction failed. Please try again.');
      }
    } catch (err) {
      console.error('Error purchasing card:', err);
      setError('Failed to purchase card. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle bid placement
  const handlePlaceBid = async (e) => {
    e.preventDefault();
    if (!listing || !bidAmount || !placeBid) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      const success = await placeBid(tokenId, bidAmount);
      
      if (success) {
        // Only try to refresh listing details if successful
        if (getListing) {
          try {
            const details = await getListingDetails(tokenId);
            if (details) {
              listing = details;
            }
          } catch (refreshErr) {
            console.warn('Failed to refresh listing details:', refreshErr);
          }
        }
        setBidAmount('');
      } else {
        setError('Bid placement failed. Please try again.');
      }
    } catch (err) {
      console.error('Error placing bid:', err);
      setError('Failed to place bid. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle listing cancellation
  const handleCancelListing = async () => {
    if (!listing || !cancelListing) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      const success = await cancelListing(listing.tokenId);
      
      if (success) {
        navigate('/my-cards');
      } else {
        setError('Cancellation failed. Please try again.');
      }
    } catch (err) {
      console.error('Error canceling listing:', err);
      setError('Failed to cancel listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Show loading state or nothing if card data failed to load
  if (loading) return <div className="bg-white rounded-lg shadow-md p-4 animate-pulse h-64"></div>;
  if (!card) return null;



  const { pokemonId, name, rarity, types, typeIds, owner } = card;
  var listing;
  ({ listing } = card);

  // Check if user is the owner of the card
  const isOwner = card?.owner && account && 
    card.owner.toLowerCase() === account.toLowerCase();
  
  // Check if user is the seller
  const isSeller = listing?.seller && account && 
    listing.seller.toLowerCase() === account.toLowerCase();
  
  // Calculate minimum bid amount
  const minimumBid = listing?.highestBid 
    ? parseFloat(formatEth(listing.highestBid)) * 1.1 
    : parseFloat(formatEth(listing?.price || '0'));
  
  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="bg-gray-200 h-64 rounded-lg mb-4"></div>
          <div className="bg-gray-200 h-6 rounded w-3/4 mb-2"></div>
          <div className="bg-gray-200 h-4 rounded w-1/2 mb-4"></div>
          <div className="bg-gray-200 h-24 rounded mb-4"></div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }
  
  // No card found
  if (!card) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Card not found
        </div>
      </div>
    );
  }


  // Generate image URL safely
  const imageUrl = getPokemonImageUrl(pokemonId);

  // Convert unix endtime to local date and time
  let localEndDateTime;
  if(listing.isActive && listing.isAuction){
    const d = new Date(listing.endTime * 1000);
    const localEndDate = d.toLocaleDateString()

    const localEndTime = d.toLocaleTimeString()

    localEndDateTime = `${localEndDate} ${localEndTime}`
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Image and stats */}
        <div className="w-full">
          <div className="relative w-full pb-[137.5%] overflow-hidden rounded-lg shadow-md">
            <img 
              src={imageUrl} 
              alt={name}
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>
          
          {/* Pokemon Types */}
          {typeIds && typeIds.length > 0 && (
            <div className="grid grid-cols-2 gap-1 mt-2">
              {typeIds.map((typeId) => (
                <img
                  src= {`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/${typeId}.png`}
                  class="rounded-full"
                />
              ))}
            </div>
          )}

          <div className="text-sm text-gray-500 mt-2">
            <div>Token ID: #{tokenId}</div>
            <div>Owner: {owner}</div>
          </div>


        </div>
        
        {/* Card Details */}
        <div>
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <h1 className="text-3xl font-bold mr-3 capitalize">{card.name}</h1>
              <span className={classNames(
                'px-2 py-1 text-xs font-medium rounded', 
                getRarityClass(card.rarity)
              )}>
                {getRarityName(card.rarity)}
              </span>
            </div>
            
            {/* Transaction UI */}
            {listing.isActive && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">
                  {listing.isAuction ? 'Current Auction' : 'Available for Purchase'}
                </h2>
                
                {listing.isAuction ? (
                  <>
                    <div className="mb-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-gray-600">Current Bid:</div>
                        <div className="font-semibold">{formatEth(listing.highestBid)}</div>
                        <div className="text-gray-600">Highest Bidder:</div>
                        <div className="font-semibold">{formatAddress(listing.highestBidder) || 'No bids yet'}</div>
                        <div className="text-gray-600">End Time:</div>
                        <div className="font-semibold">{localEndDateTime}</div>
                      </div>
                    </div>
                    
                    {!isOwner && account && (
                      <form onSubmit={handlePlaceBid} className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Your Bid (ETH)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min={minimumBid}
                            value={bidAmount}
                            onChange={handleBidAmountChange}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter bid amount"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 disabled:bg-gray-400"
                        >
                          {submitting ? 'Processing...' : 'Place Bid'}
                        </button>
                      </form>
                    )}
                  </>
                ) : (
                  <div className="mb-4">
                    <div className="text-2xl font-bold mb-2">{formatEth(listing.price)}</div>
                    {!isOwner && account && (
                      <button
                        onClick={handlePurchase}
                        disabled={submitting}
                        className="w-full py-2 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 disabled:bg-gray-400"
                      >
                        {submitting ? 'Processing...' : 'Buy Now'}
                      </button>
                    )}
                  </div>
                )}
                
                {/* Show cancel button only if user is the seller */}
                {isSeller && (
                  <button
                    onClick={handleCancelListing}
                    disabled={submitting}
                    className="w-full py-2 border border-red-500 text-red-500 font-medium rounded hover:bg-red-50 disabled:opacity-50"
                  >
                    {submitting ? 'Processing...' : 'Cancel Listing'}
                  </button>
                )}
              </div>
            )}
            
            {/* Listing UI for owners */}
            {isOwner && !listing.isActive && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">List This Card</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (ETH)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter price in ETH"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        if (!listCardForSale) {
                          setError("Listing function not available");
                          return;
                        }
                        setSubmitting(true);
                        setError("");
                        listCardForSale(tokenId, price)
                          .then(success => {
                            if (success) {
                              navigate('/my-cards');
                            } else {
                              setError("Failed to list card. Please try again.");
                            }
                          })
                          .catch(err => {
                            console.error("Error listing card:", err);
                            setError("Failed to list card: " + (err.message || err));
                          })
                          .finally(() => {
                            setSubmitting(false);
                          });
                      }}
                      disabled={!price || submitting}
                      className="py-2 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 disabled:bg-gray-400"
                    >
                      {submitting ? 'Processing...' : 'List for Sale'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
          </div>
          
          {/* Card Description */}
          <div>
            <h2 className="text-xl font-semibold mb-2">About This Card</h2>
            <p className="text-gray-700">
              {card.description || `This is a ${getRarityName(rarity).toLowerCase()} ${name} Pokémon card. It's of the type ${types?.join(' and ')}.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDetailPage; 