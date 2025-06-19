
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button, Alert, Box, Typography, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { web3Login } from '../../redux/action/user';
import toast from 'react-hot-toast';

const Web3Auth = () => {
  const [account, setAccount] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isFetching } = useSelector((state) => state.user);

  useEffect(() => {
    // Check if MetaMask is installed
    setIsMetaMaskInstalled(typeof window.ethereum !== 'undefined');
    
    // Check if already connected
    checkIfWalletIsConnected();
    
    // Set up event listeners for account changes and disconnections
    setupEventListeners();
    
    // Cleanup event listeners on unmount
    return () => {
      cleanupEventListeners();
    };
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const connectWallet = async () => {
    if (!isMetaMaskInstalled) {
      toast.error('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);
    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        const selectedAccount = accounts[0];
        setAccount(selectedAccount);
        
        // Sign a message to verify ownership
        await signMessage(selectedAccount);
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      if (error.code === 4001) {
        toast.error('Please connect to MetaMask.');
      } else {
        toast.error('An error occurred while connecting to MetaMask.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const signMessage = async (walletAddress) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Create a message to sign
      const message = `Sign this message to authenticate with your wallet.\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;
      
      // Sign the message
      const signature = await signer.signMessage(message);
      
      // Send to backend for verification
      await authenticateWithBackend(walletAddress, message, signature);
      
    } catch (error) {
      console.error('Error signing message:', error);
      toast.error('Failed to sign message. Authentication cancelled.');
      setAccount('');
    }
  };

  const authenticateWithBackend = async (walletAddress, message, signature) => {
    try {
      const result = await dispatch(web3Login({ walletAddress, message, signature }));
      
      // Store wallet address in localStorage for persistence
      localStorage.setItem('walletAddress', walletAddress);
      localStorage.setItem('authMethod', 'web3');
      
      toast.success(`Successfully logged in with wallet: ${formatAddress(walletAddress)}`);
      
      // Navigate to dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Backend authentication failed:', error);
      toast.error('Authentication failed. Please try again.');
      setAccount('');
    }
  };

  const disconnectWallet = () => {
    setAccount('');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('authMethod');
    toast.success('Wallet disconnected');
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const setupEventListeners = () => {
    if (window.ethereum) {
      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      // Listen for disconnection
      window.ethereum.on('disconnect', handleDisconnect);
      
      // Listen for chain changes (optional - for network switching)
      window.ethereum.on('chainChanged', handleChainChanged);
    }
  };

  const cleanupEventListeners = () => {
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('disconnect', handleDisconnect);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    }
  };

  const handleAccountsChanged = async (accounts) => {
    console.log('Accounts changed:', accounts);
    
    if (accounts.length === 0) {
      // User disconnected all accounts
      handleWalletDisconnection();
    } else if (accounts[0] !== account) {
      // User switched to a different account
      const newAccount = accounts[0];
      setAccount(newAccount);
      
      toast.info(`Switched to account: ${formatAddress(newAccount)}`);
      
      // Re-authenticate with the new account
      try {
        await signMessage(newAccount);
      } catch (error) {
        console.error('Failed to authenticate new account:', error);
        toast.error('Failed to authenticate with new account');
        handleWalletDisconnection();
      }
    }
  };

  const handleDisconnect = (error) => {
    console.log('Wallet disconnected:', error);
    handleWalletDisconnection();
  };

  const handleChainChanged = (chainId) => {
    console.log('Chain changed to:', chainId);
    // Optionally reload the page or handle network changes
    toast.info('Network changed. Please reconnect your wallet if needed.');
  };

  const handleWalletDisconnection = () => {
    setAccount('');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('authMethod');
    
    // Clear user data from Redux store
    dispatch({ type: 'LOGOUT' });
    
    toast.info('Wallet disconnected');
    
    // Redirect to login page if currently on protected routes
    if (window.location.pathname.includes('/dashboard')) {
      navigate('/auth/login');
    }
  };

  if (!isMetaMaskInstalled) {
    return (
      <Box className="p-4 border rounded-lg bg-yellow-50">
        <Alert severity="warning" className="mb-4">
          MetaMask is not installed
        </Alert>
        <Typography variant="body2" className="mb-3">
          To use Web3 authentication, you need to install MetaMask browser extension.
        </Typography>
        <Button
          variant="outlined"
          onClick={() => window.open('https://metamask.io/download/', '_blank')}
        >
          Install MetaMask
        </Button>
      </Box>
    );
  }

  return (
    <Box className="p-4 border rounded-lg bg-blue-50">
      <Typography variant="h6" className="mb-3 text-center">
        Web3 Wallet Authentication
      </Typography>
      
      {!account ? (
        <Box className="text-center">
          <Typography variant="body2" className="mb-3">
            Connect your MetaMask wallet to authenticate
          </Typography>
          <Button
            variant="contained"
            onClick={connectWallet}
            disabled={isConnecting || isFetching}
            className="bg-blue-600 hover:bg-blue-700"
            startIcon={isConnecting && <CircularProgress size={20} />}
          >
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </Button>
        </Box>
      ) : (
        <Box className="text-center">
          <Alert severity="success" className="mb-3">
            Connected to wallet: {formatAddress(account)}
          </Alert>
          <Button
            variant="outlined"
            onClick={disconnectWallet}
            color="error"
          >
            Disconnect Wallet
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Web3Auth;
