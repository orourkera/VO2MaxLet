'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/providers/AuthProvider';
import { TrainingTimer } from '@/components/TrainingTimer';
import { PaymentButton } from '@/components/PaymentButton';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';

// Dynamically import WalletMultiButton with SSR disabled
const WalletMultiButton = dynamic(
    () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
    { ssr: false }
);

const WORKOUT_STRUCTURE = {
    warmup: 10 * 60, // 10 minutes in seconds
    highIntensity: 4 * 60, // 4 minutes in seconds
    recovery: 4 * 60, // 4 minutes in seconds
    cooldown: 10 * 60, // 10 minutes in seconds
};

const PAYMENT_AMOUNT = 0.01; // Define payment amount constant

export default function HomePage() {
    const { user, loading, error } = useAuth();
    const [isSessionStarted, setIsSessionStarted] = useState(false);
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = async () => {
        if (!publicKey || !sendTransaction || !user) {
            console.error('Missing required data:', { publicKey: !!publicKey, sendTransaction: !!sendTransaction, user: !!user });
            return;
        }

        try {
            setIsProcessing(true);
            console.log('Starting payment process...', { userId: user.id, amount: PAYMENT_AMOUNT });

            // Create payment request
            console.log('Making API call to create payment...');
            const response = await fetch('http://localhost:3001/api/payments/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    amount: PAYMENT_AMOUNT,
                }),
            }).catch(error => {
                console.error('Fetch error:', error);
                throw error;
            });

            console.log('API response status:', response?.status);
            console.log('API response ok:', response?.ok);

            if (!response?.ok) {
                const errorText = await response?.text();
                console.error('API error response:', errorText);
                throw new Error(`Failed to create payment request: ${errorText}`);
            }

            const data = await response.json();
            console.log('Payment request created:', data);
            const { paymentRequest, paymentId } = data;

            // Create transaction
            console.log('Creating Solana transaction...');
            const transaction = new Transaction();
            transaction.add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: new PublicKey(paymentRequest.recipient),
                    lamports: paymentRequest.amount,
                })
            );

            // Get latest blockhash
            console.log('Getting latest blockhash...');
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            // Send transaction
            console.log('Sending transaction...');
            const signature = await sendTransaction(transaction, connection);
            console.log('Transaction sent:', signature);

            // Wait for confirmation
            console.log('Waiting for confirmation...');
            const confirmation = await connection.confirmTransaction(signature);
            if (confirmation.value.err) {
                throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
            }

            // Verify payment
            console.log('Verifying payment with signature and paymentId...');
            const verifyResponse = await fetch('http://localhost:3001/api/payments/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    transactionHash: signature,
                    paymentId: paymentId
                }),
            });

            if (!verifyResponse.ok) {
                const errorData = await verifyResponse.text();
                throw new Error(`Payment verification failed: ${errorData}`);
            }

            console.log('Payment completed successfully!');
            setIsSessionStarted(true);
        } catch (error) {
            console.error('Payment error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    // Always render the main layout with the Wallet button
    return (
        <div className="container mx-auto px-4 py-8 relative min-h-[80vh]">
            {/* Wallet button top right (remains) */}
            <div className="absolute top-4 right-4 z-10">
                <WalletMultiButton />
            </div>

            <h1 className="text-3xl font-bold mb-8 text-center">Norwegian VO2 Max Training</h1>

            {loading ? (
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
                    <h2 className="text-2xl font-bold mb-4 text-red-500">Connection Error</h2>
                    <div className="bg-red-50 p-4 rounded-lg mb-4 max-w-md text-center">
                        <p className="text-red-700">{error}</p>
                    </div>
                    <p className="text-gray-600 mb-4">Please try connecting your wallet again.</p>
                </div>
            ) : !user ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
                    <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
                    <p className="text-gray-600 mb-4">Please connect your wallet to access training sessions.</p>
                </div>
            ) : !isSessionStarted ? (
                // ----- User connected, show Timer Structure and Pay Button ----- 
                <div className="flex flex-col items-center justify-center p-4">
                    {/* Timer Structure Display */}
                    <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 mb-20">
                        <h2 className="text-2xl font-semibold mb-6 text-center">Workout Phases</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between p-3 bg-gray-100 rounded">
                                <span className="font-medium">Warm-up</span>
                                <span className="text-gray-600">{Math.floor(WORKOUT_STRUCTURE.warmup / 60)} mins (Zone 2)</span>
                            </div>
                            <div className="flex justify-between p-3 bg-red-100 rounded">
                                <span className="font-medium">High Intensity</span>
                                <span className="text-red-700">{Math.floor(WORKOUT_STRUCTURE.highIntensity / 60)} mins (Zone 5)</span>
                            </div>
                            <div className="flex justify-between p-3 bg-green-100 rounded">
                                <span className="font-medium">Recovery</span>
                                <span className="text-green-700">{Math.floor(WORKOUT_STRUCTURE.recovery / 60)} mins (Zone 2)</span>
                            </div>
                            <div className="flex justify-between p-3 bg-blue-100 rounded">
                                <span className="font-medium">Cool-down</span>
                                <span className="text-blue-700">{Math.floor(WORKOUT_STRUCTURE.cooldown / 60)} mins (Zone 2)</span>
                            </div>
                        </div>
                    </div>

                    {/* Pay Button - Positioned bottom right relative to the main container */}
                    <button
                        onClick={handlePayment}
                        disabled={isProcessing || !publicKey}
                        className="absolute bottom-8 right-8 bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed z-10" 
                    >
                        {isProcessing ? 'Processing...' : `Pay ${PAYMENT_AMOUNT} SOL to Start`}
                    </button>
                </div>
                // ----- End Timer Structure and Pay Button section ----- 
            ) : (
                // Session started, show timer
                <div className="flex flex-col items-center justify-center p-4">
                    <TrainingTimer 
                        structure={WORKOUT_STRUCTURE}
                        onComplete={() => setIsSessionStarted(false)}
                    />
                </div>
            )}
        </div>
    );
}
