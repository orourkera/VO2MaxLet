'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import of WalletMultiButton with ssr disabled
const DynamicWalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

export const CustomWalletButton = () => {
  const { connected } = useWallet();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Set mounted state to true after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle workout history navigation
  const handleWorkoutHistory = () => {
    router.push('/workout-history');
  };

  // Return null during server-side rendering or before component mounts
  if (!mounted) {
    return null;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* Standard wallet button */}
      <DynamicWalletMultiButton />

      {/* Only show history button when connected */}
      {connected && (
        <button
          onClick={handleWorkoutHistory}
          style={{
            backgroundColor: 'transparent',
            color: '#a78bfa',
            border: 'none',
            height: '42px',
            width: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            position: 'relative',
            outline: 'none',
            marginLeft: '6px',
            padding: 0
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = '#c4b5fd';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = '#a78bfa';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Workout History"
          aria-label="View Workout History"
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </button>
      )}
    </div>
  );
}; 