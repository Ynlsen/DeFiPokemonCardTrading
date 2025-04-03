import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import PokemonCard from '../components/specific/PokemonCard';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';
import { RARITIES, LoadingSpinner, formatEth } from '../utils';


const MyCardsPage = () => {
  const { 
    account, 
    getOwnedCards, 
    getPendingWithdrawals,
    withdrawFunds,
    contracts
  } = useApp();
  const [cards, setCards] = useState([]);
  const [loadingState, setLoadingState] = useState(true);
  const [pendingWithdrawalAmount, setPendingWithdrawalAmount] = useState('0');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState(null);

  const fetchCards = async () => {
    setLoadingState(true);
    try {
      const ownedCards = await getOwnedCards();
      setCards(ownedCards);
    } catch (err) {
      console.error('Error fetching owned cards:', err);
      setCards([]);
    } finally {
      setLoadingState(false);
    }
  };

  const fetchPendingWithdrawals = async () => {
    try {
      const amount = await getPendingWithdrawals(account);
      setPendingWithdrawalAmount(amount || '0');
      setWithdrawError(null);
    } catch (err) {
      console.error('Error fetching pending withdrawals:', err);
      setPendingWithdrawalAmount('0');
      setWithdrawError('Failed to fetch withdrawal balance.');
    }
  };

  useEffect(() => {
    if (account && contracts?.tradingContract) {
      fetchPendingWithdrawals();
    }
  }, [account, contracts?.tradingContract]);

  useEffect(() => {
    if (account) {
      fetchCards();
    }
  }, [account]);

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    setWithdrawError(null);
    try {
      const success = await withdrawFunds();
      if (success) {
        await fetchPendingWithdrawals();
      } else {
        setWithdrawError('Withdrawal transaction failed. Please try again.');
      }
    } catch (err) {
      console.error('Error during withdrawal:', err);
      setWithdrawError('An error occurred during withdrawal.');
    } finally {
      setIsWithdrawing(false);
    }
  };


  return (
    <div className="max-w-6xl mx-auto p-4">
      <PageHeader
        title="My Pokémon Cards"
        description="View and manage your collection"
        action={
          account && (
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-xs text-gray-500 text-right">Available:</p>
                <p className="text-sm font-semibold text-right">{formatEth(pendingWithdrawalAmount)}</p>
                {withdrawError && <p className="text-xs text-red-500 mt-1 text-right">{withdrawError}</p>} 
              </div>
              <Button 
                onClick={handleWithdraw}
                disabled={isWithdrawing || pendingWithdrawalAmount === '0' || !pendingWithdrawalAmount}
                variant="secondary"
                size="sm"
              >
                {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
              </Button>
            </div>
          )
        }
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
          title = "No Cards"
          message="You don't have any cards yet"
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