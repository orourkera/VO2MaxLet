'use client';

import React from 'react';

interface CircularProgressTimerProps {
    totalDuration: number; 
    remainingTime: number; 
    size?: number;         
    strokeWidth?: number;  
    // Change props to accept color *values*
    trackColorValue?: string;    // e.g., '#4b5563' (gray-600)
    progressColorValue?: string; // e.g., '#14f195' (Solana green)
    textColorValue?: string;     // e.g., '#e5e7eb' (gray-200)
}

// Helper function to format time (can be reused or imported)
const formatTime = (totalSeconds: number): string => {
    if (totalSeconds < 0) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
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
    // Update defaults to color values
    trackColorValue = '#4b5563',    // Default gray-600
    progressColorValue = '#14f195', // Default Solana green
    textColorValue = '#e5e7eb',    // Default gray-200
}) => {
    if (totalDuration <= 0) return null; 

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.max(0, Math.min(1, remainingTime / totalDuration));
    const offset = circumference - progress * circumference;

    const formattedTime = formatTime(remainingTime);

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
                 // Apply color via inline style, keep transition class
                className={"transition-[stroke-dashoffset] duration-300 ease-linear"}
                style={{
                    stroke: progressColorValue,
                    strokeDasharray: circumference,
                    strokeDashoffset: offset,
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
                    fontFamily: "var(--font-serif)"
                }} 
                // Keep other utility classes
                className={`transform rotate-90 origin-center font-bold`} 
            >
                {formattedTime}
            </text>
        </svg>
    );
};
