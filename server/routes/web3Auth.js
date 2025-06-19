
import express from 'express';
import { web3Login, web3Register } from '../controllers/web3Auth.js';

const router = express.Router();

router.post('/login', web3Login);
router.post('/register', web3Register);

export default router;
