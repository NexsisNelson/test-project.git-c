
import { ethers } from 'ethers';
import User from '../models/user.js';
import { createError } from '../utils/error.js';
import jwt from 'jsonwebtoken';

export const web3Login = async (req, res, next) => {
    try {
        const { walletAddress, message, signature } = req.body;

        if (!walletAddress || !message || !signature) {
            return next(createError(400, 'Wallet address, message, and signature are required'));
        }

        // Verify the signature
        const recoveredAddress = ethers.verifyMessage(message, signature);
        
        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            return next(createError(401, 'Invalid signature'));
        }

        // Check if user exists with this wallet address
        let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

        if (!user) {
            // Create new user with wallet address
            user = await User.create({
                firstName: 'Web3',
                lastName: 'User',
                username: `web3_${walletAddress.slice(0, 8)}`,
                walletAddress: walletAddress.toLowerCase(),
                password: 'web3_auth', // Placeholder password for web3 users
                city: 'Digital',
                role: 'client',
                authMethod: 'web3'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { _id: user._id, role: user.role, walletAddress: walletAddress.toLowerCase() },
            process.env.JWT_SECRET
        );

        res.status(200).json({
            result: { ...user._doc, token },
            message: 'Web3 authentication successful',
            success: true
        });

    } catch (error) {
        console.error('Web3 authentication error:', error);
        next(createError(500, 'Web3 authentication failed'));
    }
};

export const web3Register = async (req, res, next) => {
    try {
        const { walletAddress, message, signature, firstName, lastName, city } = req.body;

        if (!walletAddress || !message || !signature) {
            return next(createError(400, 'Wallet address, message, and signature are required'));
        }

        // Verify the signature
        const recoveredAddress = ethers.verifyMessage(message, signature);
        
        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            return next(createError(401, 'Invalid signature'));
        }

        // Check if user already exists
        const existingUser = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
        if (existingUser) {
            return next(createError(400, 'User with this wallet address already exists'));
        }

        // Create new user
        const newUser = await User.create({
            firstName: firstName || 'Web3',
            lastName: lastName || 'User',
            username: `web3_${walletAddress.slice(0, 8)}_${Date.now()}`,
            walletAddress: walletAddress.toLowerCase(),
            password: 'web3_auth', // Placeholder password for web3 users
            city: city || 'Digital',
            role: 'client',
            authMethod: 'web3'
        });

        // Generate JWT token
        const token = jwt.sign(
            { _id: newUser._id, role: newUser.role, walletAddress: walletAddress.toLowerCase() },
            process.env.JWT_SECRET
        );

        res.status(201).json({
            result: { ...newUser._doc, token },
            message: 'Web3 user registered successfully',
            success: true
        });

    } catch (error) {
        console.error('Web3 registration error:', error);
        next(createError(500, 'Web3 registration failed'));
    }
};
