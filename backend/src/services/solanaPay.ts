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

    async verifyPayment(transactionHash: string, userId: string, appId: string, amount: number) {
        try {
            // Get the transaction
            const transaction = await this.connection.getTransaction(transactionHash);
            
            if (!transaction) {
                throw new Error('Transaction not found');
            }

            // Verify the transaction was successful
            if (!transaction.meta?.err) {
                // Update payment status in database
                await paymentService.updatePaymentStatus(transactionHash, 'completed');
                return true;
            } else {
                await paymentService.updatePaymentStatus(transactionHash, 'failed');
                return false;
            }
        } catch (error) {
            console.error('Error verifying payment:', error);
            throw error;
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
                reference // Using reference as transaction hash initially
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