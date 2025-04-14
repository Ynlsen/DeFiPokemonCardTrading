import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import PokemonCard from '../components/specific/PokemonCard';
import EmptyState from '../components/common/EmptyState';
import { formatEth } from '../utils';


/**
 * MyCardsPage component – Displays owned cards and withdraw interface
 */
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
    if (account && contracts?.tokenContract) {
      fetchCards();
    }
  }, [account, contracts?.tokenContract]);

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">My Pokémon Cards</h1>
          <p className="text-gray-600">View and manage your collection</p>
        </div>
        {account && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 gap-2 md:gap-0">
              <div className="text-left md:text-right">
                <p className="text-xs text-gray-500">Available:</p>
                <p className="text-sm font-semibold">{formatEth(pendingWithdrawalAmount)}</p>
                {withdrawError && <p className="text-xs text-red-500 mt-1">{withdrawError}</p>}
              </div>
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={isWithdrawing || pendingWithdrawalAmount === '0' || !pendingWithdrawalAmount}
                className={`inline-flex items-center justify-center rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500 px-3 py-1.5 text-sm w-full md:w-auto ${
                  (isWithdrawing || pendingWithdrawalAmount === '0' || !pendingWithdrawalAmount) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
              </button>
            </div>
          </div>
        )}
      </div>

      {!account ? (
        <EmptyState
          title = "Wallet Not Connected"
          message="Connect your wallet to view your cards"
        />
      ) : loadingState ? (
        <div className="text-center py-12">
          <p className="mt-4 text-lg">Loading your cards...</p>
        </div>
      ) : cards.length === 0 ? (
        <EmptyState
          title = "No Cards"
          message="You don't have any cards yet"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map(card => (
            <PokemonCard key={card} tokenId={card} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCardsPage; 