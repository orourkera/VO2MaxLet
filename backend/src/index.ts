// Remove global error handlers
// process.on('uncaughtException', (error) => {
//   console.error('!!! Uncaught Exception:', error);
//   process.exit(1); // Exit after logging
// });
// 
// process.on('unhandledRejection', (reason, promise) => {
//   console.error('!!! Unhandled Rejection at:', promise, 'reason:', reason);
//   // Optionally exit, or let the app continue if applicable
//   // process.exit(1);
// });

import 'dotenv/config';
import express, { Request, Response, RequestHandler, NextFunction } from 'express';
// import cors from 'cors'; // Remove cors import
import { Connection, PublicKey } from '@solana/web3.js';
import { userService, appService, trainingService, paymentService } from './services/database'; // Uncomment
import { SolanaPayService } from './services/solanaPay'; // Uncomment
import paymentRoutes from './routes/payments'; // Uncomment

// Initialize Express app
const app = express();
const port = process.env.PORT || 3001;

// Define the manual CORS middleware function with explicit type
const manualCorsHandler: RequestHandler = (req, res, next) => {
  console.log(`[CORS Handler] Received request: ${req.method} ${req.path}`); // Log incoming request

  const allowedOrigin = 'http://localhost:3000'; // Allow requests from frontend
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH'); // Include OPTIONS
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept'); // Allow necessary headers
  res.header('Access-Control-Allow-Credentials', 'true'); // If your frontend sends credentials
  console.log(`[CORS Handler] Set headers for origin: ${allowedOrigin}`); // Log header setting

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log(`[CORS Handler] Handling OPTIONS preflight for ${req.path}`); // Log OPTIONS handling
    res.sendStatus(204); // Send 204 No Content
    console.log(`[CORS Handler] Sent 204 for OPTIONS`); // Log sending 204
    return; // Explicitly return void here
  }

  console.log(`[CORS Handler] Passing non-OPTIONS request to next()`); // Log passing to next
  next(); // Pass control to the next middleware
};

// Use the defined middleware function
app.use(manualCorsHandler);

// Explicit CORS options (Temporarily permissive for debugging) - REMOVE THESE
// const corsOptions = {

// Enable CORS for frontend with specific options - REMOVE THIS
// app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Initialize Solana connection
const solanaConnection = new Connection(
    process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', // Keep using devnet
    'confirmed'
);

// Initialize Solana Pay service
const solanaPayService = new SolanaPayService(
    solanaConnection,
    process.env.MERCHANT_WALLET_ADDRESS || ''
);

// Create router for API routes
const router = express.Router();

// Apply CORS to the router specifically (with options) - REMOVE THIS
// router.use(cors(corsOptions)); 

// Health check endpoint
router.get('/health', ((req, res) => {
    res.json({ status: 'ok' });
}) as RequestHandler);

// User endpoints - UNCOMMENT
router.post('/users', ((req, res) => {
    const { walletAddress } = req.body;
    if (!walletAddress) {
        return res.status(400).json({ error: 'Wallet address is required' });
    }

    userService.createUser(walletAddress)
        .then(user => res.json(user))
        .catch(error => {
            console.error('Error creating user:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
}) as RequestHandler);

// Training session endpoints - UNCOMMENT
router.post('/training-sessions', ((req, res) => {
    const { userId, appId, sessionData } = req.body;
    if (!userId || !appId || !sessionData) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    trainingService.createSession(userId, appId, sessionData)
        .then(session => res.json(session))
        .catch(error => {
            console.error('Error creating training session:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
}) as RequestHandler);

// Mount payment routes, passing the service instance
router.use('/payments', paymentRoutes(solanaPayService));

// Use router at /api prefix
app.use('/api', router);

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
