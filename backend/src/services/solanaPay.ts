import { Connection, PublicKey } from '@solana/web3.js';
import { paymentService } from './database';

export class SolanaPayService {
    private connection: Connection;
    private merchantWallet: PublicKey;

    constructor(connection: Connection, merchantWalletAddress: string) {
        this.connection = connection;
        this.merchantWallet = new PublicKey(merchantWalletAddress);
    }

    async createPaymentRequest(amount: number, reference: string) {
        // Convert amount to lamports (1 SOL = 1,000,000,000 lamports)
        const lamports = Math.floor(amount * 1_000_000_000);

        return {
            recipient: this.merchantWallet.toBase58(),
            amount: lamports,
            reference: reference,
            label: 'VO2 Max Training Session',
            message: 'Payment for training session',
            memo: `VO2 Max Training - ${reference}`,
        };
    }

    async verifyPayment(transactionHash: string, paymentId: string) {
        try {
            // Get the transaction
            const transaction = await this.connection.getTransaction(transactionHash);
            
            if (!transaction) {
                // Optionally: Could mark payment as failed if tx not found after a reasonable time
                // await paymentService.failPaymentStatus(paymentId);
                throw new Error('Transaction not found');
            }

            // Verify the transaction was successful
            if (!transaction.meta?.err) {
                // Update payment status in database using paymentId and the actual signature
                await paymentService.updatePaymentStatus(paymentId, transactionHash);
                return true;
            } else {
                // Mark payment as failed using paymentId
                await paymentService.failPaymentStatus(paymentId);
                console.warn(`Transaction ${transactionHash} failed on-chain.`);
                return false;
            }
        } catch (error) {
            console.error(`Error verifying payment for ID ${paymentId} and hash ${transactionHash}:`, error);
            // Don't mark as failed here if the error is temporary (e.g., network issue)
            // If the error is persistent (e.g., PGRST116 from updatePaymentStatus), 
            // it implies the paymentId didn't exist, which shouldn't happen in normal flow.
            throw error; // Re-throw to be handled by the route handler
        }
    }

    async createAndTrackPayment(userId: string, appId: string, amount: number, currency: string = 'SOL') {
        try {
            // Generate a unique reference
            const reference = `VO2-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Create payment request
            const paymentRequest = await this.createPaymentRequest(amount, reference);

            // Create payment record in database
            const payment = await paymentService.createPayment(
                userId,
                appId,
                amount,
                currency,
                reference // Store reference initially
            );

            return {
                paymentRequest,
                paymentId: payment.id
            };
        } catch (error) {
            console.error('Error creating payment:', error);
            throw error;
        }
    }
} 