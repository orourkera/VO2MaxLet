import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Connection, PublicKey } from '@solana/web3.js';
import { userService, appService, trainingService, paymentService } from './services/database';
import { SolanaPayService } from './services/solanaPay';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Solana connection
const solanaConnection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  'confirmed'
);

// Initialize Solana Pay service
const solanaPay = new SolanaPayService(
  solanaConnection,
  process.env.MERCHANT_WALLET_ADDRESS || ''
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// User endpoints
app.post('/api/users', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const user = await userService.createUser(walletAddress);
    res.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Training session endpoints
app.post('/api/training-sessions', async (req, res) => {
  try {
    const { userId, appId, sessionData } = req.body;
    if (!userId || !appId || !sessionData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const session = await trainingService.createSession(userId, appId, sessionData);
    res.json(session);
  } catch (error) {
    console.error('Error creating training session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Payment endpoints
app.post('/api/payments/create', async (req, res) => {
  try {
    const { userId, appId, amount } = req.body;
    if (!userId || !appId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await solanaPay.createAndTrackPayment(userId, appId, amount);
    res.json(result);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/payments/verify', async (req, res) => {
  try {
    const { transactionHash, userId, appId, amount } = req.body;
    if (!transactionHash || !userId || !appId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const verified = await solanaPay.verifyPayment(transactionHash, userId, appId, amount);
    res.json({ verified });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
