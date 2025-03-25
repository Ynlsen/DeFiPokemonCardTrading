import React, { memo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatEth, getRarityClass, getRarityName, formatAddress } from '../../utils';
import { getPokemonImageUrl } from '../../utils/getPokemonImageUrl';
import { useApp } from '../../contexts/AppContext';

/**
 * PokemonCard component - Displays a Pokemon card with data fetched based on tokenId
 */
const PokemonCard = ({ tokenId, fType = "", compact = false }) => {
  const { getCardData, getListingDetails, getPokemonData } = useApp();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch all card data when tokenId changes
  useEffect(() => {
    const fetchCardData = async () => {
      if (!tokenId) return;
      
      setLoading(true);
      try {
        // Get basic card data from smart contract (pokemonId, rarity, owner)
        const cardData = await getCardData(tokenId);
        if (!cardData) return;
        
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
          name: pokemonData?.name || `Pokemon #${cardData.pokemonId}`,
          types: pokemonData?.types || [],
          typeIds: pokemonData?.typeIds || [],
          listing
        });
      } catch (error) {
        console.error(`Error fetching data for card #${tokenId}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchCardData();
  }, [tokenId]);

  // Show loading state or nothing if card data failed to load
  if (loading) return <div className="bg-white rounded-lg shadow-md p-4 animate-pulse h-64"></div>;
  if (!card) return null;
  
  const { pokemonId, name, rarity, types, typeIds, owner, listing } = card;
  
  // Use simplified image URL generation with fallback handling
  const imageUrl = getPokemonImageUrl(pokemonId);

  // Format the address directly
  const ownerDisplay = owner ? formatAddress(owner) : '';
  
  // Get price from listing if available
  const price = listing?.price;
  const highestBid = listing?.highestBid;
  const isAuction = listing?.isAuction;

  // Format the price display
  const priceDisplay = formatEth(isAuction ? (highestBid || price) : price);


  return ( ( fType == "" || fType == 'all' || types.includes(fType) ) && (
    <Link
      to={`/card/${tokenId}`}
      className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Card Image */}
      <div className="relative overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="w-full aspect-509/700"
        />
        
        {/* Card Rarity Badge */}
        <div className={`absolute top-2 right-2 ${getRarityClass(rarity)} px-2 py-1 rounded-full text-xs font-medium shadow-sm`}>
          {getRarityName(rarity)}
        </div>
      </div>

      {/* Card Details */}
      <div className="p-3">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-medium text-gray-900 truncate capitalize">
            #{tokenId} {name || `Pokemon #${pokemonId}`}
          </h3>
        </div>

        {!compact && (
          <>
            {/* Types */}
            {typeIds && typeIds.length > 0 && (
              <div className="grid grid-cols-2 gap-1 mb-2">
                {typeIds.map((typeId) => (
                  <img
                    src= {`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/sword-shield/${typeId}.png`}
                    class="rounded-full"
                  />
                ))}
              </div>
            )}

            {/* Owner */}
            {owner && (
              <div className="text-sm text-gray-500 mb-1">
                Owner: {ownerDisplay}
              </div>
            )}
          </>
        )}

        {/* Listing Info */}
        {listing && (
          <div className="mt-2 flex justify-between items-center">
            <span className="text-sm font-medium">
              {isAuction ? 'Current Bid' : 'Price'}:
            </span>
            <span className="font-bold text-indigo-600">
              {priceDisplay} ETH
            </span>
          </div>
        )}
      </div>
    </Link>
    )
  );
};

export default PokemonCard; 