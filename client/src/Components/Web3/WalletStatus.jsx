
import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip, Paper, Alert } from '@mui/material';
import { AccountBalanceWallet, Warning } from '@mui/icons-material';
import toast from 'react-hot-toast';

const WalletStatus = ({ walletAddress, isConnected }) => {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [networkInfo, setNetworkInfo] = useState(null);

  useEffect(() => {
    if (walletAddress && window.ethereum) {
      checkRealTimeConnection();
      setupConnectionMonitoring();
    }
  }, [walletAddress]);

  const checkRealTimeConnection = async () => {
    try {
      if (window.ethereum && walletAddress) {
        // Check if the wallet is still connected
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const isStillConnected = accounts.some(
          account => account.toLowerCase() === walletAddress.toLowerCase()
        );
        
        if (isStillConnected) {
          setConnectionStatus('connected');
          
          // Get network information
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          const networkName = getNetworkName(chainId);
          setNetworkInfo({ chainId, name: networkName });
        } else {
          setConnectionStatus('disconnected');
          toast.warning('Wallet connection lost');
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setConnectionStatus('error');
    }
  };

  const setupConnectionMonitoring = () => {
    if (window.ethereum) {
      const handleAccountChange = (accounts) => {
        if (accounts.length === 0) {
          setConnectionStatus('disconnected');
        } else {
          const currentAccount = accounts[0];
          if (currentAccount.toLowerCase() === walletAddress.toLowerCase()) {
            setConnectionStatus('connected');
          } else {
            setConnectionStatus('account_changed');
          }
        }
      };

      const handleChainChange = (chainId) => {
        const networkName = getNetworkName(chainId);
        setNetworkInfo({ chainId, name: networkName });
      };

      window.ethereum.on('accountsChanged', handleAccountChange);
      window.ethereum.on('chainChanged', handleChainChange);

      // Cleanup on unmount
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountChange);
        window.ethereum.removeListener('chainChanged', handleChainChange);
      };
    }
  };

  const getNetworkName = (chainId) => {
    const networks = {
      '0x1': 'Ethereum Mainnet',
      '0x3': 'Ropsten Testnet',
      '0x4': 'Rinkeby Testnet',
      '0x5': 'Goerli Testnet',
      '0xaa36a7': 'Sepolia Testnet',
      '0x89': 'Polygon Mainnet',
      '0x13881': 'Polygon Mumbai',
      '0xa86a': 'Avalanche Mainnet',
      '0xa869': 'Avalanche Fuji Testnet'
    };
    return networks[chainId] || `Unknown Network (${chainId})`;
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected || !walletAddress || connectionStatus === 'disconnected') {
    return (
      <Paper className="p-3 mb-4 bg-gray-50">
        <Box className="flex items-center gap-2">
          <AccountBalanceWallet className="text-gray-400" />
          <Typography variant="body2" color="textSecondary">
            No wallet connected
          </Typography>
          <Chip label="Disconnected" color="default" size="small" />
        </Box>
      </Paper>
    );
  }

  if (connectionStatus === 'account_changed') {
    return (
      <Paper className="p-3 mb-4 bg-orange-50">
        <Alert severity="warning" className="mb-2">
          <Box className="flex items-center gap-2">
            <Warning className="text-orange-600" />
            <Typography variant="body2">
              Account changed in wallet. Please reconnect.
            </Typography>
          </Box>
        </Alert>
        <Typography variant="body2" className="text-gray-700">
          <strong>Original Address:</strong> {formatAddress(walletAddress)}
        </Typography>
      </Paper>
    );
  }

  if (connectionStatus === 'error') {
    return (
      <Paper className="p-3 mb-4 bg-red-50">
        <Alert severity="error">
          Connection error. Please check your wallet and try again.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper className="p-3 mb-4 bg-green-50">
      <Box className="flex items-center gap-2 mb-2">
        <AccountBalanceWallet className="text-green-600" />
        <Typography variant="h6" className="text-green-800">
          Wallet Connected
        </Typography>
        <Chip label="Live" color="success" size="small" />
      </Box>
      <Typography variant="body2" className="text-gray-700">
        <strong>Address:</strong> {formatAddress(walletAddress)}
      </Typography>
      <Typography variant="body2" className="text-gray-700">
        <strong>Full Address:</strong> {walletAddress}
      </Typography>
      {networkInfo && (
        <Typography variant="body2" className="text-gray-700">
          <strong>Network:</strong> {networkInfo.name}
        </Typography>
      )}
      <Typography variant="body2" className="text-gray-600 mt-1">
        <strong>Authentication:</strong> Web3 Wallet (Active)
      </Typography>
    </Paper>
  );
};

export default WalletStatus;
