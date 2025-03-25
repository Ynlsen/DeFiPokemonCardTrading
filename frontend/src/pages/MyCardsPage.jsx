import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import PokemonCard from '../components/specific/PokemonCard';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';
import { RARITIES, LoadingSpinner } from '../utils';


const MyCardsPage = () => {
  const { account, getOwnedCards, mintPokemonCard } = useApp();
  const [cards, setCards] = useState([]);
  const [loadingState, setLoadingState] = useState(true);

  // Fetch owned cards when account changes
  useEffect(() => {
    fetchCards();
  }, [account]);

  const fetchCards = async () => {
    if (!account) return;
    
    setLoadingState(true);

    try {
      const ownedCards = await getOwnedCards();

      setCards(ownedCards);

    } catch (err) {
      console.error('Error fetching owned cards:', err);
    } finally {
      setLoadingState(false);
    }
  };


  return (
    <div className="max-w-6xl mx-auto p-4">
      <PageHeader
        title="My Pokémon Cards"
        description="View and manage your collection"
      />

      {!account ? (
        <EmptyState
          message="Connect your wallet to view your cards"
          icon="🔌"
        />
      ) : loadingState ? (
        <div className="text-center py-12">
          <LoadingSpinner size="lg" />
          <p className="mt-4">Loading your cards...</p>
        </div>
      ) : cards.length === 0 ? (
        <EmptyState
          message="You don't have any cards yet"
          subMessage="Mint your first Pokémon card to start your collection"
          icon="🃏"
          action={
            <Button
              variant="primary"
              onClick={() => setMintDialogOpen(true)}
            >
              Mint Your First Card
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map(card => (
            <PokemonCard tokenId={card.tokenId} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCardsPage; 