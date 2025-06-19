
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { WalletStatus } from '../../Components';
import { Box, Typography, Paper, Button, Alert } from '@mui/material';
import toast from 'react-hot-toast';

const WalletInfo = () => {
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionEvents, setConnectionEvents] = useState([]);

  useEffect(() => {
    // Check if user is logged in with Web3
    const authMethod = localStorage.getItem('authMethod');
    const storedWalletAddress = localStorage.getItem('walletAddress');
    
    if (authMethod === 'web3' && currentUser?.walletAddress) {
      setWalletAddress(currentUser.walletAddress);
      setIsConnected(true);
    } else if (storedWalletAddress) {
      setWalletAddress(storedWalletAddress);
      setIsConnected(true);
    } else {
      setIsConnected(false);
    }
  }, [currentUser]);

  // Check if MetaMask is still connected and set up event listeners
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum && walletAddress) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          const isStillConnected = accounts.some(
            account => account.toLowerCase() === walletAddress.toLowerCase()
          );
          setIsConnected(isStillConnected);
          
          if (!isStillConnected) {
            addConnectionEvent('Wallet disconnected', 'warning');
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
          setIsConnected(false);
          addConnectionEvent('Connection check failed', 'error');
        }
      }
    };

    const setupEventListeners = () => {
      if (window.ethereum) {
        const handleAccountsChanged = (accounts) => {
          if (accounts.length === 0) {
            setIsConnected(false);
            addConnectionEvent('All accounts disconnected', 'error');
            handleWalletDisconnection();
          } else if (walletAddress && accounts[0].toLowerCase() !== walletAddress.toLowerCase()) {
            addConnectionEvent(`Account switched from ${walletAddress.slice(0, 6)}... to ${accounts[0].slice(0, 6)}...`, 'info');
            setWalletAddress(accounts[0]);
            toast.info('Account switched in wallet');
          }
        };

        const handleDisconnect = () => {
          setIsConnected(false);
          addConnectionEvent('Wallet disconnected', 'error');
          handleWalletDisconnection();
        };

        const handleChainChanged = (chainId) => {
          addConnectionEvent(`Network changed to chain ID: ${chainId}`, 'info');
          toast.info('Network changed in wallet');
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('disconnect', handleDisconnect);
        window.ethereum.on('chainChanged', handleChainChanged);

        return () => {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('disconnect', handleDisconnect);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        };
      }
    };

    if (walletAddress) {
      checkConnection();
      const cleanup = setupEventListeners();
      return cleanup;
    }
  }, [walletAddress]);

  const addConnectionEvent = (message, type) => {
    const event = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setConnectionEvents(prev => [event, ...prev.slice(0, 4)]); // Keep last 5 events
  };

  const handleWalletDisconnection = () => {
    setWalletAddress('');
    setIsConnected(false);
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('authMethod');
    
    // Clear user data
    dispatch({ type: 'LOGOUT' });
    
    toast.error('Wallet disconnected. Redirecting to login...');
    
    // Redirect to login after a short delay
    setTimeout(() => {
      navigate('/auth/login');
    }, 2000);
  };

  const handleManualDisconnect = () => {
    handleWalletDisconnection();
    addConnectionEvent('Manual disconnect', 'info');
  };

  return (
    <Box className="p-4">
      <Typography variant="h5" className="mb-4">
        Wallet Information
      </Typography>
      
      <WalletStatus 
        walletAddress={walletAddress} 
        isConnected={isConnected} 
      />
      
      {isConnected && walletAddress && (
        <>
          <Paper className="p-4 bg-blue-50 mb-4">
            <Typography variant="h6" className="mb-2 text-blue-800">
              Connection Details
            </Typography>
            <Typography variant="body2" className="mb-1">
              <strong>Provider:</strong> MetaMask
            </Typography>
            <Typography variant="body2" className="mb-1">
              <strong>Status:</strong> Active Session
            </Typography>
            <Typography variant="body2" className="mb-3 text-gray-600">
              <strong>Login Time:</strong> {new Date().toLocaleString()}
            </Typography>
            <Button 
              variant="outlined" 
              color="error" 
              onClick={handleManualDisconnect}
              size="small"
            >
              Disconnect Wallet
            </Button>
          </Paper>

          {connectionEvents.length > 0 && (
            <Paper className="p-4 bg-gray-50">
              <Typography variant="h6" className="mb-2 text-gray-800">
                Connection Events
              </Typography>
              {connectionEvents.map((event) => (
                <Alert 
                  key={event.id} 
                  severity={event.type} 
                  className="mb-2"
                >
                  <Box className="flex justify-between items-center">
                    <Typography variant="body2">
                      {event.message}
                    </Typography>
                    <Typography variant="caption" className="text-gray-500">
                      {event.timestamp}
                    </Typography>
                  </Box>
                </Alert>
              ))}
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};

export default WalletInfo;
