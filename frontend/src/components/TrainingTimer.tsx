'use client';

import { FC, useState, useEffect } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAuth } from '@/providers/AuthProvider';

interface TrainingTimerProps {
    structure: {
        warmup: number;
        highIntensity: number;
        recovery: number;
        cooldown: number;
    };
    onComplete: () => void;
    onPhaseChange?: (phaseName: string, timeLeft: number) => void;
    isPaused?: boolean;
}

type Phase = 'warmup' | 'highIntensity' | 'recovery' | 'cooldown' | 'complete';

export const TrainingTimer: FC<TrainingTimerProps> = ({ 
    structure, 
    onComplete, 
    onPhaseChange,
    isPaused = false // Default to not paused
}) => {
    const { supabase } = useSupabase();
    const { user } = useAuth();
    const [phase, setPhase] = useState<Phase>('warmup');
    const [timeLeft, setTimeLeft] = useState(structure.warmup);
    const [sessionStartTime] = useState(new Date());

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (!isPaused && phase !== 'complete') {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        // Move to next phase
                        switch (phase) {
                            case 'warmup':
                                setPhase('highIntensity');
                                const highIntensityTime = structure.highIntensity;
                                // Make sure we call onPhaseChange with updated values
                                if (onPhaseChange) {
                                    onPhaseChange('High Intensity', highIntensityTime);
                                }
                                return highIntensityTime;
                            case 'highIntensity':
                                setPhase('recovery');
                                const recoveryTime = structure.recovery;
                                if (onPhaseChange) {
                                    onPhaseChange('Recovery', recoveryTime);
                                }
                                return recoveryTime;
                            case 'recovery':
                                setPhase('cooldown');
                                const cooldownTime = structure.cooldown;
                                if (onPhaseChange) {
                                    onPhaseChange('Cool-down', cooldownTime);
                                }
                                return cooldownTime;
                            case 'cooldown':
                                setPhase('complete');
                                handleSessionComplete();
                                onComplete();
                                return 0;
                            default:
                                return prev;
                        }
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [phase, isPaused, structure, onComplete, onPhaseChange]);

    useEffect(() => {
        if (onPhaseChange && phase !== 'complete') {
            const phaseInfo = getPhaseInfo();
            console.log('Calling onPhaseChange with:', phaseInfo.name, timeLeft);
            onPhaseChange(phaseInfo.name, timeLeft);
        }
    }, [phase, timeLeft, onPhaseChange]);

    const handleSessionComplete = async () => {
        if (!user) return;

        try {
            const sessionDuration = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000);
            
            const { error } = await supabase
                .from('training_sessions')
                .insert([{
                    user_id: user.id,
                    session_type: 'norwegian_vo2max',
                    duration: sessionDuration,
                    completed: true,
                    warmup_duration: structure.warmup,
                    high_intensity_duration: structure.highIntensity,
                    recovery_duration: structure.recovery,
                    cooldown_duration: structure.cooldown
                }]);

            if (error) {
                console.error('Error recording training session:', error);
            }
        } catch (err) {
            console.error('Failed to record training session:', err);
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getPhaseInfo = () => {
        switch (phase) {
            case 'warmup':
                return {
                    name: 'Warm-up',
                    description: 'Zone 2 - Light intensity, you should be able to hold a conversation',
                    color: '#eab308' // yellow-500
                };
            case 'highIntensity':
                return {
                    name: 'High Intensity',
                    description: 'Zone 5 - Maximum effort, this should feel very hard',
                    color: '#ef4444' // red-500
                };
            case 'recovery':
                return {
                    name: 'Recovery',
                    description: 'Zone 2 - Light intensity, focus on recovery',
                    color: '#22c55e' // green-500
                };
            case 'cooldown':
                return {
                    name: 'Cool-down',
                    description: 'Zone 2 - Light intensity, gradually reduce effort',
                    color: '#3b82f6' // blue-500
                };
            default:
                return {
                    name: 'Complete',
                    description: 'Great work! You\'ve completed your session.',
                    color: '#a855f7' // purple-500
                };
        }
    };

    const phaseInfo = getPhaseInfo();

    if (phase === 'complete') {
        return (
            <div style={{
                maxWidth: '28rem',
                margin: '0 auto',
                textAlign: 'center'
            }}>
                <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    fontFamily: 'var(--font-serif)', 
                    color: '#f3f4f6'
                }}>
                    Workout Complete!
                </h2>
                <p style={{
                    color: '#9ca3af',
                    marginBottom: '1.5rem'
                }}>
                    Great job! You've completed your VO2 max training session.
                </p>
                <button
                    onClick={onComplete}
                    style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        fontWeight: 'bold',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.25rem',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 150ms ease'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
                >
                    Finish
                </button>
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: '28rem',
            margin: '0 auto'
        }}>
            <div style={{
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                padding: '1.5rem',
                backgroundColor: phaseInfo.color,
                color: 'white'
            }}>
                <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                    fontFamily: 'var(--font-serif)'
                }}>
                    {phaseInfo.name}
                </h2>
                <p style={{
                    marginBottom: '1rem'
                }}>
                    {phaseInfo.description}
                </p>
                <div style={{
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    fontFamily: 'var(--font-serif)'
                }}>
                    {formatTime(timeLeft)}
                </div>
            </div>
        </div>
    );
}; 