import { Router, Request, Response, RequestHandler } from 'express';
import { PublicKey } from '@solana/web3.js';
import { supabase, appService } from '../services/database';
import { SolanaPayService } from '../services/solanaPay';

// Export a function that takes the service and returns the router
export default function(solanaPayService: SolanaPayService): Router {
    const router = Router();

    // Use RequestHandler type
    router.post('/create', (async (req: Request, res: Response) => {
        try {
            const { userId, amount } = req.body;
            const appName = 'vo2max-app'; // Define app name

            if (!userId || !amount) {
                return res.status(400).json({ error: 'Missing required parameters' });
            }

            // Fetch the application details by name
            const app = await appService.getAppByName(appName);
            if (!app) {
                console.error(`Application with name "${appName}" not found.`);
                return res.status(404).json({ error: `Application "${appName}" not found` });
            }
            const appId = app.id; // Get the UUID

            // Use the passed-in SolanaPayService instance with the fetched appId
            const { paymentRequest, paymentId } = await solanaPayService.createAndTrackPayment(
                userId,
                appId, // Use the fetched UUID
                amount
            );

            res.json({ paymentRequest, paymentId });
        } catch (error) {
            console.error('Payment creation error:', error);
            res.status(500).json({ error: 'Failed to create payment request' });
        }
    }) as RequestHandler);

    // Use RequestHandler type
    router.post('/verify', (async (req: Request, res: Response) => {
        try {
            // Expect paymentId and transactionHash
            const { transactionHash, paymentId } = req.body; 

            if (!transactionHash || !paymentId) {
                return res.status(400).json({ error: 'Missing required parameters: transactionHash and paymentId' });
            }

            // No longer need appId or userId here if paymentId is sufficient
            // const appName = 'vo2max-app';
            // const app = await appService.getAppByName(appName);
            // if (!app) {
            //     console.error(`Application with name "${appName}" not found during verification.`);
            //     return res.status(404).json({ error: `Application "${appName}" not found` });
            // }
            // const appId = app.id;

            // Call verifyPayment with transactionHash and paymentId
            const verified = await solanaPayService.verifyPayment(
                transactionHash,
                paymentId 
            );

            if (!verified) {
                // Verification failed (likely transaction failed on-chain or wasn't found yet)
                // SolanaPayService logs the reason
                return res.status(400).json({ error: 'Payment verification failed. Transaction may have failed or is still processing.' }); 
            }

            // If verifyPayment succeeded, the DB update also succeeded
            res.json({ verified: true }); 

        } catch (error: any) { // Added type annotation for error
            console.error('Payment verification route error:', error);

            // Specific handling for Transaction not found from SolanaPayService
            if (error instanceof Error && error.message === 'Transaction not found') {
                return res.status(404).json({ error: 'Transaction signature not found on Solana network yet. Please wait and try again.' });
            }

            // Specific handling for paymentId not found in DB (PGRST116 from update/fail status)
            if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') {
                 console.error('Verification failed: Payment record not found for paymentId.');
                 return res.status(404).json({ error: 'Payment record not found for the provided payment ID.' });
            }

            // Generic error
            res.status(500).json({ error: 'Failed to verify payment' });
        }
    }) as RequestHandler);

    return router;
} 