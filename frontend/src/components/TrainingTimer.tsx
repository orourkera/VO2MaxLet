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
}

type Phase = 'warmup' | 'highIntensity' | 'recovery' | 'cooldown' | 'complete';

export const TrainingTimer: FC<TrainingTimerProps> = ({ structure, onComplete }) => {
    const { supabase } = useSupabase();
    const { user } = useAuth();
    const [phase, setPhase] = useState<Phase>('warmup');
    const [timeLeft, setTimeLeft] = useState(structure.warmup);
    const [isPaused, setIsPaused] = useState(false);
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
                                return structure.highIntensity;
                            case 'highIntensity':
                                setPhase('recovery');
                                return structure.recovery;
                            case 'recovery':
                                setPhase('cooldown');
                                return structure.cooldown;
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
    }, [phase, isPaused, structure, onComplete]);

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
                    color: 'bg-yellow-500'
                };
            case 'highIntensity':
                return {
                    name: 'High Intensity',
                    description: 'Zone 5 - Maximum effort, this should feel very hard',
                    color: 'bg-red-500'
                };
            case 'recovery':
                return {
                    name: 'Recovery',
                    description: 'Zone 2 - Light intensity, focus on recovery',
                    color: 'bg-green-500'
                };
            case 'cooldown':
                return {
                    name: 'Cool-down',
                    description: 'Zone 2 - Light intensity, gradually reduce effort',
                    color: 'bg-blue-500'
                };
            default:
                return {
                    name: 'Complete',
                    description: 'Great work! You\'ve completed your session.',
                    color: 'bg-purple-500'
                };
        }
    };

    const phaseInfo = getPhaseInfo();

    if (phase === 'complete') {
        return (
            <div className="max-w-md mx-auto text-center">
                <h2 className="text-2xl font-bold mb-4">Workout Complete!</h2>
                <p className="text-gray-600 mb-6">Great job! You've completed your VO2 max training session.</p>
                <button
                    onClick={onComplete}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Finish
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto">
            <div className={`rounded-lg shadow-lg p-6 ${phaseInfo.color} text-white`}>
                <h2 className="text-2xl font-bold mb-2">{phaseInfo.name}</h2>
                <p className="mb-4">{phaseInfo.description}</p>
                <div className="text-5xl font-bold mb-4">{formatTime(timeLeft)}</div>
                <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="bg-white text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-100"
                >
                    {isPaused ? 'Resume' : 'Pause'}
                </button>
            </div>
        </div>
    );
}; 