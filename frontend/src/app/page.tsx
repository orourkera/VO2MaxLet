'use client';

// Updated for Vercel deployment - April 2025
import { useState, useEffect, useMemo, ChangeEvent } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/providers/AuthProvider';
import { TrainingTimer } from '@/components/TrainingTimer';
import { CircularProgressTimer } from '@/components/CircularProgressTimer';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import Link from 'next/link';
import { useSupabase } from '@/providers/SupabaseProvider';
import Header from '@/components/Header';

// Import CustomWalletButton dynamically with SSR disabled
const CustomWalletButton = dynamic(
    () => import('@/components/CustomWalletButton').then(mod => mod.CustomWalletButton),
    { ssr: false }
);

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

const PAYMENT_AMOUNT = 0.005; // Define payment amount constant

// Re-add dynamic import for WalletMultiButton but we won't use it directly
const WalletMultiButton = dynamic(
    () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
    { ssr: false }
);

// Add this function near the top of the file with the other utility functions
const formatTime = (totalSeconds: number): string => {
    if (totalSeconds < 0) totalSeconds = 0;
    
    // Ensure we're working with integers by rounding
    totalSeconds = Math.round(totalSeconds);
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    
    const parts: string[] = [];
    if (hours > 0) {
        parts.push(hours.toString().padStart(2, '0'));
    }
    parts.push(minutes.toString().padStart(2, '0'));
    parts.push(seconds.toString().padStart(2, '0'));
    
    return parts.join(':');
};

export default function HomePage() {
    const { user, loading, error } = useAuth();
    const [isSessionStarted, setIsSessionStarted] = useState(false);
    const { publicKey, sendTransaction, connected } = useWallet();
    const { connection } = useConnection();
    const [isProcessing, setIsProcessing] = useState(false);
    const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
    const [currentTime, setCurrentTime] = useState<number>(Date.now());
    const [solPrice, setSolPrice] = useState<number | null>(null);

    // State for the editable structure (times in minutes)
    const [editableStructure, setEditableStructure] = useState<EditableStructure>(DEFAULT_STRUCTURE_MINUTES);

    // Fetch SOL price on component mount
    useEffect(() => {
        const fetchSolPrice = async () => {
            try {
                const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
                const data = await response.json();
                setSolPrice(data.solana.usd);
            } catch (error) {
                console.error('Error fetching SOL price:', error);
            }
        };
        
        fetchSolPrice();
        
        // Refresh price every 5 minutes
        const interval = setInterval(fetchSolPrice, 5 * 60 * 1000);
        
        return () => clearInterval(interval);
    }, []);

    // Recalculate total duration whenever editableStructure changes
    const totalWorkoutDuration = useMemo(() => {
        const structureInSeconds = convertStructureToSeconds(editableStructure);
        return calculateTotalDuration(structureInSeconds);
    }, [editableStructure]);

    // Add new state variables at the top of the HomePage component
    const [currentPhase, setCurrentPhase] = useState<string>('');
    const [currentPhaseTimeLeft, setCurrentPhaseTimeLeft] = useState<number>(0);
    const [isPaused, setIsPaused] = useState(false);

    // Single consolidated timer effect that handles both total time and phase time
    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;
        
        if (isSessionStarted && !isPaused) {
            // Update more frequently for smoother animation (200ms instead of 1000ms)
            interval = setInterval(() => {
                // Update current time (for total timer)
                setCurrentTime(Date.now());
                
                // Only decrement phase timer if the TrainingTimer isn't updating it
                // (This is a fallback, the phase updates should come from TrainingTimer)
                if (currentPhaseTimeLeft > 0) {
                    // Decrement by a smaller amount for smoother animation
                    // Use a more precise approach to avoid floating point errors
                    setCurrentPhaseTimeLeft(prev => {
                        const newValue = Math.max(0, prev - 0.2);
                        // For very small values, just go to 0 to avoid potential issues
                        return newValue < 0.2 ? 0 : newValue;
                    });
                }
            }, 200); // Update 5 times per second instead of once per second
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    // Explicitly include all dependencies to ensure array size doesn't change
    }, [isSessionStarted, isPaused, sessionStartTime, currentPhaseTimeLeft]);

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
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
            console.log('Using API URL:', apiUrl);
            const response = await fetch(`${apiUrl}/api/payments/create`, {
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
            const verifyResponse = await fetch(`${apiUrl}/api/payments/verify`, {
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
            
            // Initialize phase data for immediate display
            const initialPhase = 'Warm-up';
            const initialTime = editableStructure.warmup * 60;
            setCurrentPhase(initialPhase);
            setCurrentPhaseTimeLeft(initialTime);
            setCurrentPhaseTotalDuration(initialTime);
            console.log('Setting initial phase data:', initialPhase, initialTime);
        } catch (error) {
            console.error('Payment error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSessionComplete = async () => {
        if (user && sessionStartTime !== null) {
            try {
                const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
                const structure = convertStructureToSeconds(editableStructure);
                
                // Save workout as completed
                const { error } = await supabase
                    .from('training_sessions')
                    .insert([{
                        user_id: user.id,
                        session_type: 'norwegian_vo2max',
                        duration: sessionDuration,
                        completed: true, // Fully completed workout
                        warmup_duration: structure.warmup,
                        high_intensity_duration: structure.highIntensity,
                        recovery_duration: structure.recovery,
                        cooldown_duration: structure.cooldown
                    }]);

                if (error) {
                    console.error('Error recording completed training session:', error);
                } else {
                    console.log('Successfully saved completed workout data');
                }
            } catch (err) {
                console.error('Failed to record completed session:', err);
            }
        }
        
        // Reset the state
        setIsSessionStarted(false);
        setSessionStartTime(null);
        setCurrentPhase('');
        setCurrentPhaseTimeLeft(0);
        setCurrentPhaseTotalDuration(0);
    };

    // Handlers for input changes
    const handleStructureChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // Only allow numeric input
        if (!/^\d*$/.test(value)) return;
        
        const intValue = value === '' ? 0 : parseInt(value, 10);
        
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

    // Add a new state for tracking the current phase's total duration
    const [currentPhaseTotalDuration, setCurrentPhaseTotalDuration] = useState<number>(0);
    
    // Update the phase change handler to track both current time and total phase duration
    const handlePhaseChange = (phaseName: string, timeLeft: number) => {
        console.log('Phase changed:', phaseName, 'Time left:', timeLeft);
        
        // Calculate total phase duration based on the phase name
        let phaseTotalDuration = timeLeft; // Default to current time left
        
        // Look up the total duration for the phase based on its name
        if (structureForTimer) {
            switch(phaseName) {
                case 'Warm-up':
                    phaseTotalDuration = structureForTimer.warmup;
                    break;
                case 'High Intensity':
                    phaseTotalDuration = structureForTimer.highIntensity;
                    break;
                case 'Recovery':
                    phaseTotalDuration = structureForTimer.recovery;
                    break;
                case 'Cool-down':
                    phaseTotalDuration = structureForTimer.cooldown;
                    break;
            }
        }
        
        // Only update if values actually changed to prevent unnecessary re-renders
        if (phaseName !== currentPhase) {
            setCurrentPhase(phaseName);
        }
        
        // Update both time left and total duration
        setCurrentPhaseTimeLeft(timeLeft);
        setCurrentPhaseTotalDuration(phaseTotalDuration);
    };

    // Add new state for the confirmation modal
    const [showEndWorkoutModal, setShowEndWorkoutModal] = useState(false);

    // Import the Supabase hook
    const { supabase } = useSupabase();
    
    // Track previous connection state to detect disconnects
    const [wasConnected, setWasConnected] = useState(false);
    
    // Effect to detect wallet disconnection during active workout
    useEffect(() => {
        // If previously connected but now disconnected, and workout is in progress
        if (wasConnected && !connected && isSessionStarted) {
            console.log('Wallet disconnected during workout - prompting to save/discard');
            // Show the end workout modal
            setShowEndWorkoutModal(true);
        }
        
        // Update previous connection state
        setWasConnected(connected);
    }, [connected, isSessionStarted, wasConnected]);

    // Function to handle ending workout early
    const handleEndWorkoutEarly = async (shouldSave: boolean) => {
        if (shouldSave && user && sessionStartTime !== null) {
            console.log('Saving workout data...');
            
            try {
                // Calculate actual workout duration in seconds
                const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
                
                // Calculate how much of each phase was completed
                // This is an estimate based on the remaining time in the current phase
                const phasesCompleted = calculateCompletedPhases(currentPhase, currentPhaseTimeLeft);
                
                // Save to database
                const { error } = await supabase
                    .from('training_sessions')
                    .insert([{
                        user_id: user.id,
                        session_type: 'norwegian_vo2max',
                        duration: sessionDuration,
                        completed: false, // Marked as incomplete since it was ended early
                        warmup_duration: phasesCompleted.warmup,
                        high_intensity_duration: phasesCompleted.highIntensity,
                        recovery_duration: phasesCompleted.recovery,
                        cooldown_duration: phasesCompleted.cooldown,
                        early_termination: true
                    }]);

                if (error) {
                    console.error('Error recording training session:', error);
                } else {
                    console.log('Successfully saved workout data');
                }
            } catch (err) {
                console.error('Failed to record training session:', err);
            }
        } else {
            console.log('Discarding workout data...');
            // No need to save anything
        }
        
        // In either case, we end the workout
        setIsSessionStarted(false);
        setSessionStartTime(null);
        setCurrentPhase('');
        setCurrentPhaseTimeLeft(0);
        setCurrentPhaseTotalDuration(0);
        setShowEndWorkoutModal(false);
    };
    
    // Helper function to calculate how much of each phase was completed
    const calculateCompletedPhases = (currentPhaseName: string, currentTimeLeft: number): {
        warmup: number;
        highIntensity: number;
        recovery: number;
        cooldown: number;
    } => {
        const structure = convertStructureToSeconds(editableStructure);
        const result = {
            warmup: 0,
            highIntensity: 0,
            recovery: 0,
            cooldown: 0
        };
        
        // Mark previous phases as fully completed
        switch (currentPhaseName) {
            case 'Cool-down':
                result.recovery = structure.recovery;
                result.highIntensity = structure.highIntensity;
                result.warmup = structure.warmup;
                // For current phase, calculate time spent
                result.cooldown = structure.cooldown - currentTimeLeft;
                break;
            case 'Recovery':
                result.highIntensity = structure.highIntensity;
                result.warmup = structure.warmup;
                // For current phase, calculate time spent
                result.recovery = structure.recovery - currentTimeLeft;
                break;
            case 'High Intensity':
                result.warmup = structure.warmup;
                // For current phase, calculate time spent
                result.highIntensity = structure.highIntensity - currentTimeLeft;
                break;
            case 'Warm-up':
                // For current phase, calculate time spent
                result.warmup = structure.warmup - currentTimeLeft;
                break;
        }
        
        return result;
    };

    // Add mounted state to handle client-side rendering
    const [mounted, setMounted] = useState(false);
    
    // Set mounted state to true after component mounts
    useEffect(() => {
        setMounted(true);
    }, []);

    // Render the core UI regardless of connection status initially
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            backgroundColor: '#0d013a',
            backgroundImage: 'linear-gradient(to bottom, #1a0f6c 0%, #0d013a 40%, #05010a 100%)',
            color: '#e5e7eb',
            backgroundAttachment: 'fixed'
        }}>
            {/* Use our shared Header component with back button disabled */}
            <div style={{ position: 'relative' }}>
                <Header showBackButton={false} />
                {/* Position the wallet button in the top right */}
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '16px',
                    zIndex: 10
                }}>
                    {mounted && <CustomWalletButton />}
                </div>
            </div>

            {/* Main Content Area - Centered + Takes remaining space */}
            <main style={{
                flex: '1 1 auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 24px 48px'
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
                        fontFamily: 'var(--font-merriweather)',
                        fontSize: '2.5rem',
                        fontWeight: '300',
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
                            currentPhaseTime={currentPhaseTimeLeft}
                            currentPhaseName={currentPhase}
                            showPhaseTime={isSessionStarted}
                            currentPhaseTotalDuration={currentPhaseTotalDuration}
                        />
                        
                        {/* Pause Button - Below phase name in the circle */}
                        {isSessionStarted && (
                            <div style={{ 
                                position: 'absolute', 
                                left: '50%', 
                                top: '45%',
                                transform: 'translateX(-50%)',
                                zIndex: 20
                            }}>
                                <button
                                    onClick={() => setIsPaused(!isPaused)}
                                    style={{
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '60px',
                                        height: '60px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'background-color 150ms ease',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                                    }}
                                    aria-label={isPaused ? "Resume" : "Pause"}
                                >
                                    {/* Pause/Play Icon */}
                                    {isPaused ? (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    ) : (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        )}
                        
                        <p style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '1.125rem',
                            color: '#ffffff',
                            marginTop: '24px',
                            fontWeight: '300',
                            letterSpacing: '0.05em'
                        }}>
                            {isSessionStarted ? 'Total Remaining: ' + formatTime(displayRemainingTime) : 'Total Workout Duration'}
                        </p>
                        
                        {/* End Workout Button - Below total remaining time */}
                        {isSessionStarted && (
                            <div style={{
                                marginTop: '71px'
                            }}>
                                <button
                                    onClick={() => setShowEndWorkoutModal(true)}
                                    style={{
                                        backgroundColor: 'rgba(220, 38, 38, 0.8)', // Semi-transparent red
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '12px 24px',
                                        fontSize: '1rem',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'background-color 150ms ease',
                                        fontFamily: 'var(--font-inter)',
                                        letterSpacing: '0.02em',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                                    }}
                                >
                                    End Workout
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Conditional: Show Phase Timer OR Workout Structure Display */}
                    <div style={{ width: '100%', maxWidth: '512px', marginTop: '32px' }}>
                        {isSessionStarted ? (
                            <div style={{ display: 'none' }}>
                                <TrainingTimer 
                                    structure={structureForTimer} 
                                    onComplete={handleSessionComplete}
                                    onPhaseChange={handlePhaseChange}
                                    isPaused={isPaused}
                                />
                            </div>
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
                                    fontFamily: 'var(--font-inter)',
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
                                        <div style={{ 
                                            display: 'flex',
                                            alignItems: 'center',
                                            position: 'relative'
                                        }}>
                                            <input 
                                                type="text"
                                                id="warmup"
                                                name="warmup" 
                                                value={editableStructure.warmup}
                                                onChange={handleStructureChange}
                                                style={{
                                                    width: '60px',
                                                    padding: '8px',
                                                    paddingRight: '26px', // Make room for the carets
                                                    border: '1px solid #4b5563',
                                                    borderRadius: '8px',
                                                    textAlign: 'center',
                                                    backgroundColor: 'rgba(55, 65, 81, 0.5)',
                                                    color: '#f3f4f6',
                                                    appearance: 'none', // Hide default spinners
                                                    MozAppearance: 'textfield' // Hide default spinners in Firefox
                                                }}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                right: '8px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                height: '100%',
                                                justifyContent: 'center',
                                                gap: '2px'
                                            }}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditableStructure(prev => ({
                                                            ...prev,
                                                            warmup: prev.warmup + 1
                                                        }));
                                                    }}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#9ca3af',
                                                        cursor: 'pointer',
                                                        fontSize: '10px',
                                                        lineHeight: '10px',
                                                        padding: '0',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        height: '14px'
                                                    }}
                                                    aria-label="Increase warmup time"
                                                >
                                                    ▲
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditableStructure(prev => ({
                                                            ...prev,
                                                            warmup: Math.max(0, prev.warmup - 1)
                                                        }));
                                                    }}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#9ca3af',
                                                        cursor: 'pointer',
                                                        fontSize: '10px',
                                                        lineHeight: '10px',
                                                        padding: '0',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        height: '14px'
                                                    }}
                                                    aria-label="Decrease warmup time"
                                                >
                                                    ▼
                                                </button>
                                            </div>
                                        </div>
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
                                                fontFamily: 'var(--font-inter)',
                                                fontWeight: '500',
                                                fontSize: '1.125rem'
                                            }}>
                                                Intervals
                                            </span>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <span style={{ 
                                                    color: '#c084fc',
                                                    fontSize: '0.875rem',
                                                    marginRight: '4px'
                                                }}>
                                                    Sets:
                                                </span>
                                                <select
                                                    name="sets"
                                                    id="sets"
                                                    value={editableStructure.sets}
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value, 10);
                                                        setEditableStructure(prev => ({
                                                            ...prev,
                                                            sets: value
                                                        }));
                                                    }}
                                                    style={{
                                                        backgroundColor: 'rgba(55, 65, 81, 0.7)',
                                                        color: '#c084fc',
                                                        border: '1px solid #4b5563',
                                                        borderRadius: '6px',
                                                        padding: '4px 8px',
                                                        fontSize: '0.875rem',
                                                        fontWeight: '500',
                                                        appearance: 'none',
                                                        paddingRight: '24px', // Make room for the custom arrow
                                                        backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23c084fc%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                                                        backgroundRepeat: 'no-repeat',
                                                        backgroundPosition: 'right 8px center',
                                                        backgroundSize: '8px 8px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {/* Generate options from 1 to 10 */}
                                                    {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                                                        <option key={num} value={num}>{num}</option>
                                                    ))}
                                                </select>
                                            </div>
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
                                        <div style={{ 
                                            display: 'flex',
                                            alignItems: 'center',
                                            position: 'relative'
                                        }}>
                                            <input 
                                                type="text"
                                                id="cooldown"
                                                name="cooldown"
                                                value={editableStructure.cooldown}
                                                onChange={handleStructureChange}
                                                style={{
                                                    width: '60px',
                                                    padding: '8px',
                                                    paddingRight: '26px', // Make room for the carets
                                                    border: '1px solid #4b5563',
                                                    borderRadius: '8px',
                                                    textAlign: 'center',
                                                    backgroundColor: 'rgba(55, 65, 81, 0.5)',
                                                    color: '#f3f4f6',
                                                    appearance: 'none', // Hide default spinners
                                                    MozAppearance: 'textfield' // Hide default spinners in Firefox
                                                }}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                right: '8px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                height: '100%',
                                                justifyContent: 'center',
                                                gap: '2px'
                                            }}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditableStructure(prev => ({
                                                            ...prev,
                                                            cooldown: prev.cooldown + 1
                                                        }));
                                                    }}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#9ca3af',
                                                        cursor: 'pointer',
                                                        fontSize: '10px',
                                                        lineHeight: '10px',
                                                        padding: '0',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        height: '14px'
                                                    }}
                                                    aria-label="Increase cooldown time"
                                                >
                                                    ▲
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditableStructure(prev => ({
                                                            ...prev,
                                                            cooldown: Math.max(0, prev.cooldown - 1)
                                                        }));
                                                    }}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#9ca3af',
                                                        cursor: 'pointer',
                                                        fontSize: '10px',
                                                        lineHeight: '10px',
                                                        padding: '0',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        height: '14px'
                                                    }}
                                                    aria-label="Decrease cooldown time"
                                                >
                                                    ▼
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {!publicKey && (
                                    <p style={{
                                        textAlign: 'center',
                                        color: '#9ca3af',
                                        marginTop: '24px',
                                        fontSize: '0.875rem'
                                    }}>
                                        Connect wallet and click 'Start' to begin your session.
                                    </p>
                                )}
                                {user && !isSessionStarted && (
                                    <div style={{
                                        marginTop: '24px',
                                        display: 'flex',
                                        justifyContent: 'flex-end'
                                    }}>
                                        <button
                                            onClick={handlePayment}
                                            disabled={isProcessing || !publicKey}
                                            style={{
                                                background: 'linear-gradient(to right, #9945ff, #14f195)',
                                                color: 'white',
                                                fontWeight: '300',
                                                padding: '12px 16px',
                                                borderRadius: '12px',
                                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                                opacity: (isProcessing || !publicKey) ? '0.5' : '1',
                                                cursor: (isProcessing || !publicKey) ? 'not-allowed' : 'pointer',
                                                transition: 'all 150ms ease-in-out',
                                                border: 'none',
                                                fontSize: '14px'
                                            }}
                                        >
                                            {isProcessing ? 'Processing...' : `Pay ${PAYMENT_AMOUNT} SOL to Start`}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* SOL Price Display */}
                {!isSessionStarted && (
                    <div style={{
                        width: '100%',
                        maxWidth: '512px',
                        marginTop: '16px',
                        padding: '12px 32px', // Match the padding of the workout structure box
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.875rem',
                        color: '#9ca3af'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="16" height="16" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M93.96 42.7298H34.9982C33.1632 42.7298 32.0038 44.7125 32.9491 46.3261L47.3651 70.9964H88.7795C90.0252 70.9964 91.0617 70.0088 91.0617 68.7631C91.0617 67.5174 90.0252 66.5298 88.7795 66.5298H50.2616L38.4002 46.5631H93.96C95.2057 46.5631 96.2422 45.5755 96.2422 44.3298C96.2422 43.0842 95.2057 42.0964 93.96 42.0964V42.7298Z" fill="#9945FF"/>
                                <path d="M91.0617 54.0631H53.8241C51.9891 54.0631 50.8297 56.0458 51.775 57.6595L59.9034 71.6298H88.8929C90.1386 71.6298 91.1751 70.6422 91.1751 69.3965C91.1751 68.1508 90.1386 67.1632 88.8929 67.1632H62.8L57.2261 57.8964H91.0617C92.3074 57.8964 93.3439 56.9088 93.3439 55.6631C93.3439 54.4175 92.3074 53.4298 91.0617 53.4298V54.0631Z" fill="#9945FF"/>
                                <path d="M32.2651 84.3134L46.6811 108.984H105.644C107.479 108.984 108.638 107.001 107.693 105.387L93.277 80.7167H34.3143C33.0686 80.7167 32.0321 81.7043 32.0321 82.95C32.0321 83.1867 32.1454 83.4234 32.2651 84.3134Z" fill="#14F195"/>
                                <path d="M76.5658 96.6501H105.644C107.479 96.6501 108.638 94.6675 107.693 93.0538L99.6776 79.0835H70.6881C69.4424 79.0835 68.4059 80.0711 68.4059 81.3168C68.4059 82.5624 69.4424 83.5501 70.6881 83.5501H96.7811L102.355 92.8169H76.6791C75.4334 92.8169 74.3969 93.8045 74.3969 95.0502C74.3969 96.2958 75.4334 97.2835 76.6791 97.2835L76.5658 96.6501Z" fill="#14F195"/>
                            </svg>
                            <span>Current Solana Price:</span>
                            <span style={{ fontWeight: '500', marginLeft: '4px' }}>
                                {solPrice ? `$${solPrice.toFixed(2)} USD` : 'Loading...'}
                            </span>
                        </div>
                        <span style={{ fontWeight: '500' }}>
                            {solPrice && `Fee: $${(PAYMENT_AMOUNT * solPrice).toFixed(2)} USD`}
                        </span>
                    </div>
                )}
            </main>

            {/* End Workout Confirmation Modal */}
            {showEndWorkoutModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        backgroundColor: '#111827', // Dark gray background
                        borderRadius: '12px',
                        padding: '24px',
                        maxWidth: '90%',
                        width: '400px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(75, 85, 99, 0.4)'
                    }}>
                        <h3 style={{
                            fontSize: '1.5rem',
                            fontWeight: '600',
                            marginBottom: '16px',
                            color: 'white',
                            fontFamily: 'var(--font-inter)',
                            textAlign: 'center'
                        }}>
                            End Workout?
                        </h3>
                        <p style={{
                            fontSize: '1rem',
                            color: '#9ca3af',
                            marginBottom: '24px',
                            textAlign: 'center',
                            fontFamily: 'var(--font-inter)'
                        }}>
                            Do you want to save your progress or discard this workout?
                        </p>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '12px'
                        }}>
                            <button
                                onClick={() => setShowEndWorkoutModal(false)}
                                style={{
                                    backgroundColor: 'transparent',
                                    color: '#9ca3af',
                                    border: '1px solid #374151',
                                    borderRadius: '8px',
                                    padding: '10px 16px',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 150ms ease',
                                    flex: '1',
                                    fontFamily: 'var(--font-inter)'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleEndWorkoutEarly(false)}
                                style={{
                                    backgroundColor: '#4b5563', // Gray
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '10px 16px',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 150ms ease',
                                    flex: '1',
                                    fontFamily: 'var(--font-inter)'
                                }}
                            >
                                Discard
                            </button>
                            <button
                                onClick={() => handleEndWorkoutEarly(true)}
                                style={{
                                    backgroundColor: '#14b8a6', // Teal
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '10px 16px',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 150ms ease',
                                    flex: '1',
                                    fontFamily: 'var(--font-inter)'
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
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
                    top: '60px',
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
                height: '128px', // Doubled from 64px
                minHeight: '128px', // Doubled from 64px
                borderTop: '1px solid rgba(31, 41, 55, 0.5)',
                backgroundColor: '#000000',
                position: 'relative',
                bottom: 0,
                left: 0,
                right: 0
            }}>
                <div style={{
                    width: '100%',
                    height: '100%',
                    maxWidth: '1024px',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 24px'
                }}>
                    <p style={{
                        fontFamily: 'var(--font-inter)',
                        color: '#6b7280',
                        margin: 0,
                        fontSize: '0.875rem',
                        lineHeight: '1.4'
                    }}>
                        © {new Date().getFullYear()} Apps for Manlets.<br />
                        All Rights Reserved.
                    </p>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '8px',
                        marginRight: '30px' // Increased from 15px to 30px
                    }}>
                        <Link href="/faq" style={{
                            color: '#a78bfa',
                            transition: 'color 150ms ease',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap' // Prevent wrapping
                        }}>
                            FAQ
                        </Link>
                        <Link href="/feedback" style={{
                            color: '#a78bfa',
                            transition: 'color 150ms ease',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap' // Prevent wrapping
                        }}>
                            Feedback
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
