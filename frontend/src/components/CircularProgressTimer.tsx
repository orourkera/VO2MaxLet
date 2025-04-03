'use client';

import React from 'react';

interface CircularProgressTimerProps {
    totalDuration: number; 
    remainingTime: number; 
    size?: number;         
    strokeWidth?: number;  
    // Color values
    trackColorValue?: string;    // e.g., '#4b5563' (gray-600)
    progressColorValue?: string; // e.g., '#14f195' (Solana green)
    textColorValue?: string;     // e.g., '#e5e7eb' (gray-200)
    // New props for phase timing
    currentPhaseTime?: number;    // Current phase time remaining in seconds
    currentPhaseName?: string;    // Name of current phase
    showPhaseTime?: boolean;      // Whether to show phase time instead of total time
    currentPhaseTotalDuration?: number; // Total duration of current phase for progress calculation
}

// Helper function to format time (can be reused or imported)
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

export const CircularProgressTimer: React.FC<CircularProgressTimerProps> = ({
    totalDuration,
    remainingTime,
    size = 300,
    strokeWidth = 20,
    // Color values
    trackColorValue = '#4b5563',    // Default gray-600
    progressColorValue = '#14f195', // Default Solana green
    textColorValue = '#f3f4f6',    // Default gray-200
    // Phase timing props with defaults
    currentPhaseTime = 0,
    currentPhaseName = '',
    showPhaseTime = false,
    currentPhaseTotalDuration = 0
}) => {
    if (totalDuration <= 0) return null; 

    // Determine progress color based on the current phase
    const getPhaseColor = () => {
        if (!currentPhaseName) return progressColorValue;
        
        switch (currentPhaseName) {
            case 'Warm-up':
                return '#3b82f6'; // blue
            case 'High Intensity':
                return '#ef4444'; // red
            case 'Recovery':
                return '#22c55e'; // green
            case 'Cool-down':
                return '#3b82f6'; // blue
            default:
                return progressColorValue; // default
        }
    };

    const phaseColor = getPhaseColor();
    
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    
    // Calculate progress for the circle
    let progress: number;
    
    if (showPhaseTime && currentPhaseTotalDuration > 0) {
        // When showing phase time, use phase-specific progress 
        // The progress should go from 1 (full circle) to 0 (empty circle) as the phase progresses
        progress = Math.max(0, Math.min(1, currentPhaseTime / currentPhaseTotalDuration));
        
        // Apply some easing to make the progress feel more natural
        // This helps smooth out the transition near the ends
        // progress = Math.pow(progress, 0.9); // Optional: subtle easing effect
    } else {
        // Fallback to total progress
        progress = Math.max(0, Math.min(1, remainingTime / totalDuration));
    }

    // Determine what time to display in the timer
    const displayTime = showPhaseTime && currentPhaseTime > 0 
        ? formatTime(currentPhaseTime) 
        : formatTime(remainingTime);

    // Calculate the offset based on progress
    const offset = circumference - progress * circumference;

    console.log('CircularProgressTimer rendering:', { 
        showPhaseTime, 
        currentPhaseTime, 
        currentPhaseName,
        currentPhaseTotalDuration,
        progress,
        displayTime
    });

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
            {/* Background Track */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                strokeWidth={strokeWidth}
                fill="none"
                // Apply color via inline style
                style={{ stroke: trackColorValue }}
            />
            {/* Progress Arc */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                // Apply color via inline style, improve transition
                style={{
                    stroke: phaseColor,
                    strokeDasharray: circumference,
                    strokeDashoffset: offset,
                    transition: 'stroke-dashoffset 0.9s ease-in-out, stroke 0.6s ease'
                }}
            />
            {/* Time Text */}
            <text
                x="50%" 
                y="50%" 
                dy=".3em" 
                textAnchor="middle"
                // Apply text size and color via inline style
                style={{ 
                    fontSize: `${size * 0.18}px`,
                    fill: textColorValue, // Use fill for SVG text
                    fontFamily: "var(--font-inter)",
                    fontWeight: "300" // Lighter weight for consistency
                }} 
                // Keep other utility classes
                className={`transform rotate-90 origin-center`} 
            >
                {displayTime}
            </text>
            
            {/* Phase Name (if showing phase time) */}
            {showPhaseTime && currentPhaseName && (
                <text
                    x="50%" 
                    y="65%" 
                    textAnchor="middle"
                    style={{ 
                        fontSize: `${size * 0.08}px`,
                        fill: textColorValue,
                        fontFamily: "var(--font-inter)",
                        fontWeight: "300", // Make this lighter for hierarchy
                        letterSpacing: "0.05em",
                        opacity: 0.8 // Slightly transparent
                    }} 
                    className={`transform rotate-90 origin-center`} 
                >
                    {currentPhaseName}
                </text>
            )}
        </svg>
    );
};
