import { FC, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import { useAuth } from '@/providers/AuthProvider';

interface PaymentButtonProps {
    amount: number;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

export const PaymentButton: FC<PaymentButtonProps> = ({ amount, onSuccess, onError }) => {
    const { publicKey, connected, signTransaction } = useWallet();
    const { connection } = useConnection();
    const { user, loading: authLoading } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = async () => {
        if (!publicKey || !signTransaction || !user) return;

        try {
            setIsProcessing(true);

            // Create payment request
            const response = await fetch('http://localhost:3001/api/payments/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    appId: process.env.NEXT_PUBLIC_APP_ID,
                    amount,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create payment request');
            }

            const { paymentRequest, paymentId } = await response.json();

            // Create transaction
            const transaction = new Transaction();
            transaction.add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: new PublicKey(paymentRequest.recipient),
                    lamports: paymentRequest.amount,
                })
            );

            // Set transaction memo
            const { blockhash } = await connection.getRecentBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;
            transaction.memo = paymentRequest.memo;

            // Sign and send transaction
            const signed = await signTransaction(transaction);
            const signature = await connection.sendRawTransaction(signed.serialize());

            // Verify payment
            const verifyResponse = await fetch('http://localhost:3001/api/payments/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    transactionHash: signature,
                    userId: user.id,
                    appId: process.env.NEXT_PUBLIC_APP_ID,
                    amount,
                }),
            });

            if (!verifyResponse.ok) {
                throw new Error('Payment verification failed');
            }

            const { verified } = await verifyResponse.json();

            if (verified) {
                onSuccess?.();
            } else {
                throw new Error('Payment verification failed');
            }
        } catch (error) {
            console.error('Payment error:', error);
            onError?.(error as Error);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!connected) {
        return <WalletMultiButton />;
    }

    if (authLoading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <div>Please connect your wallet</div>;
    }

    return (
        <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
            {isProcessing ? 'Processing...' : `Pay ${amount} SOL`}
        </button>
    );
}; 