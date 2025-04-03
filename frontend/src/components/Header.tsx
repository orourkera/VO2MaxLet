'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  showBackButton?: boolean;
}

export default function Header({ showBackButton = true }: HeaderProps) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <header style={{
      height: '60px',
      borderBottom: '1px solid rgba(31, 41, 55, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* Back button - Only shown when not on home page and showBackButton is true */}
        {!isHomePage && showBackButton && (
          <Link href="/" style={{
            color: '#f3f4f6',
            textDecoration: 'none',
            fontFamily: 'var(--font-inter)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Workout
          </Link>
        )}
      </div>
      
      {/* Right side placeholder for wallet button or other controls */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* This will be populated by specific pages that need controls on the right */}
      </div>
    </header>
  );
} 