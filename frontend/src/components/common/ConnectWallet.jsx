import React from 'react';
import { useApp } from '../../contexts/AppContext';

/**
 * ConnectWallet component - Displays wallet connection status and connect/disconnect buttons
 */
const ConnectWallet = () => {
  const { state = {}, connectWallet, disconnectWallet } = useApp() || {};
  const { account, isConnected, chainId } = state?.wallet || {};

  // Format address for display (0x1234...5678)
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="flex items-center">
      {isConnected && account ? (
        <div className="flex items-center space-x-2">
          <span className="hidden md:inline-block text-sm text-gray-600">
            {formatAddress(account)}
          </span>
          <span className="inline-block w-2 h-2 rounded-full bg-green-500" title="Connected"></span>
          <button
            onClick={disconnectWallet}
            className="px-3 py-1 text-sm border border-red-500 text-red-500 rounded hover:bg-red-50"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default ConnectWallet; 