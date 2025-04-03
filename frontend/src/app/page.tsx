'use client';

import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/providers/AuthProvider';
import { TrainingTimer } from '@/components/TrainingTimer';
import { CircularProgressTimer } from '@/components/CircularProgressTimer';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import Link from 'next/link';

// Interface for structure stored in state (durations in minutes)
interface EditableStructure {
    warmup: number; 
    highIntensity: number;
    recovery: number;
    sets: number;
    cooldown: number;
}

// Default values in minutes
const DEFAULT_STRUCTURE_MINUTES: EditableStructure = {
    warmup: 10, 
    highIntensity: 4,
    recovery: 4, 
    sets: 4,
    cooldown: 10, 
};

// Function to convert structure from minutes (state) to seconds (for logic/timer)
const convertStructureToSeconds = (structure: EditableStructure) => ({
    warmup: structure.warmup * 60,
    highIntensity: structure.highIntensity * 60,
    recovery: structure.recovery * 60,
    sets: structure.sets,
    cooldown: structure.cooldown * 60,
});

// Calculate total duration (expects structure with seconds)
const calculateTotalDuration = (structureInSeconds: ReturnType<typeof convertStructureToSeconds>): number => {
    const intervalDuration = structureInSeconds.highIntensity + structureInSeconds.recovery;
    return structureInSeconds.warmup + (intervalDuration * structureInSeconds.sets) + structureInSeconds.cooldown;
};

const PAYMENT_AMOUNT = 0.01; // Define payment amount constant

// Re-add dynamic import for WalletMultiButton
const WalletMultiButton = dynamic(
    () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
    { ssr: false }
);

export default function HomePage() {
    const { user, loading, error } = useAuth();
    const [isSessionStarted, setIsSessionStarted] = useState(false);
    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();
    const [isProcessing, setIsProcessing] = useState(false);
    const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
    const [currentTime, setCurrentTime] = useState<number>(Date.now());

    // State for the editable structure (times in minutes)
    const [editableStructure, setEditableStructure] = useState<EditableStructure>(DEFAULT_STRUCTURE_MINUTES);

    // Recalculate total duration whenever editableStructure changes
    const totalWorkoutDuration = useMemo(() => {
        const structureInSeconds = convertStructureToSeconds(editableStructure);
        return calculateTotalDuration(structureInSeconds);
    }, [editableStructure]);

    useEffect(() => {
        let timerInterval: NodeJS.Timeout | undefined;
        if (isSessionStarted && sessionStartTime !== null) {
            timerInterval = setInterval(() => {
                setCurrentTime(Date.now());
            }, 1000);
        }
        return () => clearInterval(timerInterval); // Cleanup on unmount or when session stops
    }, [isSessionStarted, sessionStartTime]);

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
            setSessionStartTime(Date.now()); // Set start time when payment succeeds
            setCurrentTime(Date.now()); // Ensure current time is updated immediately
            setIsSessionStarted(true);
        } catch (error) {
            console.error('Payment error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSessionComplete = () => {
        setIsSessionStarted(false);
        setSessionStartTime(null); // Reset start time
    };

    // Handlers for input changes
    const handleStructureChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const intValue = parseInt(value, 10);
        // Basic validation: ensure it's a non-negative number
        if (!isNaN(intValue) && intValue >= 0) { 
            setEditableStructure(prev => ({
                ...prev,
                [name]: intValue, // name attribute should match state key ('warmup', 'cooldown')
            }));
        }
    };

    // Calculate remaining time
    const elapsedTime = sessionStartTime !== null ? Math.floor((currentTime - sessionStartTime) / 1000) : 0;
    const displayRemainingTime = Math.max(0, totalWorkoutDuration - elapsedTime);
    const circularTimerTotal = totalWorkoutDuration > 0 ? totalWorkoutDuration : 1;

    // Prepare structure in seconds for TrainingTimer prop
    const structureForTimer = useMemo(() => convertStructureToSeconds(editableStructure), [editableStructure]);

    // Render the core UI regardless of connection status initially
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            backgroundColor: '#0d013a',
            backgroundImage: 'linear-gradient(to bottom, #0d013a 0%, #05010a 100%)',
            color: '#e5e7eb',
            backgroundAttachment: 'fixed'
        }}>
            {/* Top section: Header space + Wallet Button */}
            <header style={{
                position: 'relative',
                height: '80px',
                borderBottom: '1px solid rgba(31, 41, 55, 0.5)',
                backdropFilter: 'blur(4px)'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    zIndex: 10
                }}>
                    <WalletMultiButton />
                </div>
            </header>

            {/* Main Content Area - Centered + Takes remaining space */}
            <main style={{
                flex: '1 1 auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 24px'
            }}>
                {/* Container for centered content */}
                <div style={{
                    width: '100%',
                    maxWidth: '640px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '32px'
                }}>
                    {/* Title */}
                    <h1 style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '2.5rem',
                        fontWeight: '500',
                        marginBottom: '8px',
                        color: '#ffffff',
                        letterSpacing: '0.08em'
                    }}>
                        VO2 MAX TRAINING
                    </h1>
                    
                    {/* Circular Timer Display */}
                    <div style={{ position: 'relative' }}>
                        <CircularProgressTimer 
                            totalDuration={circularTimerTotal} 
                            remainingTime={displayRemainingTime}
                            size={320} 
                            strokeWidth={24}
                            trackColorValue={'#1f2937'} 
                            progressColorValue={'#14f195'} 
                            textColorValue={'#f3f4f6'} 
                        />
                        <p style={{
                            fontSize: '1.125rem',
                            color: '#9ca3af',
                            marginTop: '24px',
                            fontWeight: '500'
                        }}>
                            {isSessionStarted ? 'Total Time Remaining' : 'Total Workout Duration'}
                        </p>
                    </div>

                    {/* Conditional: Show Phase Timer OR Workout Structure Display */}
                    <div style={{ width: '100%', maxWidth: '512px', marginTop: '32px' }}>
                        {isSessionStarted ? (
                            <TrainingTimer 
                                structure={structureForTimer} 
                                onComplete={handleSessionComplete}
                            />
                        ) : (
                            <div style={{
                                backgroundColor: 'rgba(31, 41, 55, 0.5)',
                                backdropFilter: 'blur(4px)',
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                                padding: '32px',
                                border: '1px solid rgba(55, 65, 81, 0.5)'
                            }}>
                                <h3 style={{
                                    fontFamily: 'var(--font-serif)',
                                    fontSize: '1.25rem',
                                    fontWeight: '600',
                                    marginBottom: '24px',
                                    color: '#f3f4f6',
                                    textAlign: 'center'
                                }}>
                                    Workout Structure
                                </h3>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px',
                                    color: '#e5e7eb'
                                }}>
                                    {/* Warmup (Editable) */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px',
                                        backgroundColor: 'rgba(55, 65, 81, 0.5)',
                                        borderRadius: '8px',
                                        backdropFilter: 'blur(4px)'
                                    }}>
                                        <label htmlFor="warmup" style={{ fontWeight: '500' }}>
                                            Warm-up (mins):
                                        </label>
                                        <input 
                                            type="number"
                                            id="warmup"
                                            name="warmup" 
                                            value={editableStructure.warmup}
                                            onChange={handleStructureChange}
                                            min="0"
                                            style={{
                                                width: '96px',
                                                padding: '8px',
                                                border: '1px solid #4b5563',
                                                borderRadius: '8px',
                                                textAlign: 'right',
                                                backgroundColor: 'rgba(55, 65, 81, 0.5)',
                                                color: '#f3f4f6'
                                            }}
                                        />
                                    </div>
                                    {/* Intervals (Fixed Display) */}
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        padding: '16px',
                                        backgroundColor: 'rgba(55, 65, 81, 0.5)',
                                        borderRadius: '8px',
                                        backdropFilter: 'blur(4px)',
                                        gap: '8px'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span style={{
                                                fontFamily: 'var(--font-serif)',
                                                fontWeight: '500',
                                                fontSize: '1.125rem'
                                            }}>
                                                Intervals
                                            </span>
                                            <span style={{
                                                color: '#c084fc',
                                                fontWeight: '500'
                                            }}>
                                                x{editableStructure.sets}
                                            </span>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            fontSize: '0.875rem'
                                        }}>
                                            <span style={{ color: '#fb923c' }}>
                                                {editableStructure.highIntensity} mins (Zone 5)
                                            </span>
                                            <span style={{ color: '#4ade80' }}>
                                                {editableStructure.recovery} mins (Zone 2/3)
                                            </span>
                                        </div>
                                    </div>
                                    {/* Cooldown (Editable) */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px',
                                        backgroundColor: 'rgba(55, 65, 81, 0.5)',
                                        borderRadius: '8px',
                                        backdropFilter: 'blur(4px)'
                                    }}>
                                        <label htmlFor="cooldown" style={{ fontWeight: '500' }}>
                                            Cool-down (mins):
                                        </label>
                                        <input 
                                            type="number"
                                            id="cooldown"
                                            name="cooldown"
                                            value={editableStructure.cooldown}
                                            onChange={handleStructureChange}
                                            min="0"
                                            style={{
                                                width: '96px',
                                                padding: '8px',
                                                border: '1px solid #4b5563',
                                                borderRadius: '8px',
                                                textAlign: 'right',
                                                backgroundColor: 'rgba(55, 65, 81, 0.5)',
                                                color: '#f3f4f6'
                                            }}
                                        />
                                    </div>
                                </div>
                                <p style={{
                                    textAlign: 'center',
                                    color: '#9ca3af',
                                    marginTop: '24px',
                                    fontSize: '0.875rem'
                                }}>
                                    Connect wallet and click 'Start' to begin your session.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Conditional Pay/Start Button */}
            {user && !isSessionStarted && (
                <div style={{
                    position: 'fixed',
                    bottom: '32px',
                    right: '32px',
                    zIndex: 10
                }}>
                    <button
                        onClick={handlePayment}
                        disabled={isProcessing || !publicKey}
                        style={{
                            background: 'linear-gradient(to right, #8b5cf6, #3b82f6)',
                            color: 'white',
                            fontWeight: 'bold',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                            opacity: (isProcessing || !publicKey) ? '0.5' : '1',
                            cursor: (isProcessing || !publicKey) ? 'not-allowed' : 'pointer',
                            transition: 'all 150ms ease-in-out',
                            border: 'none'
                        }}
                    >
                        {isProcessing ? 'Processing...' : `Pay ${PAYMENT_AMOUNT} SOL to Start`}
                    </button>
                </div>
            )}

            {/* Loading/Error Overlays */}
            {loading && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(17, 24, 39, 0.8)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50
                }}>
                    <div style={{
                        height: '48px',
                        width: '48px',
                        borderRadius: '50%',
                        borderBottom: '2px solid #c084fc',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                </div>
            )}
            {error && !loading && (
                <div style={{
                    position: 'fixed',
                    top: '80px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(127, 29, 29, 0.9)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid #b91c1c',
                    color: '#fee2e2',
                    padding: '16px 24px',
                    borderRadius: '8px',
                    zIndex: 50,
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)'
                }} role="alert">
                    <strong style={{ fontWeight: 'bold' }}>Error: </strong>
                    <span>{error}</span>
                </div>
            )}

            {/* Footer Section */}
            <footer style={{
                width: '100%',
                borderTop: '1px solid rgba(31, 41, 55, 0.5)',
                backgroundColor: 'rgba(17, 24, 39, 0.5)',
                backdropFilter: 'blur(4px)',
                padding: '24px 0',
                marginTop: 'auto'
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '1024px',
                    margin: '0 auto',
                    padding: '0 24px',
                    textAlign: 'center'
                }}>
                    <p style={{
                        fontFamily: 'var(--font-serif)',
                        color: '#6b7280',
                        marginBottom: '12px'
                    }}>
                        © {new Date().getFullYear()} VO2Max Training App. All Rights Reserved.
                    </p>
                    <Link href="/faq" style={{
                        color: '#a78bfa',
                        transition: 'color 150ms ease'
                    }}>
                        FAQ
                    </Link>
                </div>
            </footer>
        </div>
    );
}
