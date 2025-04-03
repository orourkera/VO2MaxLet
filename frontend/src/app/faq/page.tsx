'use client';

import Link from 'next/link';
import Header from '@/components/Header';

export default function FAQPage() {
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
      {/* Use the shared Header component */}
      <Header />

      {/* Main Content */}
      <main style={{
        flex: '1 1 auto',
        padding: '32px 24px',
        maxWidth: '800px',
        margin: '0 auto',
        width: '100%'
      }}>
        <h1 style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '2rem',
          fontWeight: '500',
          marginBottom: '32px',
          color: '#ffffff'
        }}>
          Frequently Asked Questions
        </h1>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* FAQ Items */}
          <div style={{
            backgroundColor: 'rgba(31, 41, 55, 0.5)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(55, 65, 81, 0.5)'
          }}>
            <h3 style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '1.25rem',
              fontWeight: '500',
              marginBottom: '12px',
              color: '#f3f4f6'
            }}>
              What is VO2 Max training?
            </h3>
            <p style={{ color: '#d1d5db', lineHeight: '1.6' }}>
              VO2 Max training is a high-intensity interval training method designed to increase your maximal oxygen uptake during exercise. The Norwegian approach alternates between high-intensity exercise (Zone 5) and moderate recovery periods (Zone 2/3) to effectively improve cardiovascular fitness.
            </p>
          </div>

          <div style={{
            backgroundColor: 'rgba(31, 41, 55, 0.5)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(55, 65, 81, 0.5)'
          }}>
            <h3 style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '1.25rem',
              fontWeight: '500',
              marginBottom: '12px',
              color: '#f3f4f6'
            }}>
              How often should I do this workout?
            </h3>
            <p style={{ color: '#d1d5db', lineHeight: '1.6' }}>
              Most experts recommend including 1-2 VO2 Max training sessions per week as part of a well-rounded fitness routine. Due to the high intensity of the workout, adequate recovery between sessions is essential. Never do VO2 Max training on consecutive days.
            </p>
          </div>

          <div style={{
            backgroundColor: 'rgba(31, 41, 55, 0.5)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(55, 65, 81, 0.5)'
          }}>
            <h3 style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '1.25rem',
              fontWeight: '500',
              marginBottom: '12px',
              color: '#f3f4f6'
            }}>
              What heart rate zones should I aim for?
            </h3>
            <p style={{ color: '#d1d5db', lineHeight: '1.6', marginBottom: '12px' }}>
              During this workout, you should target these heart rate zones:
            </p>
            <ul style={{ color: '#d1d5db', lineHeight: '1.6', paddingLeft: '24px' }}>
              <li><span style={{ color: '#3b82f6' }}>Warm-up/Cool-down:</span> 60-70% of max heart rate (Zone 1-2)</li>
              <li><span style={{ color: '#ef4444' }}>High Intensity:</span> 90-95% of max heart rate (Zone 5)</li>
              <li><span style={{ color: '#10b981' }}>Recovery:</span> 70-80% of max heart rate (Zone 2-3)</li>
            </ul>
          </div>

          <div style={{
            backgroundColor: 'rgba(31, 41, 55, 0.5)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(55, 65, 81, 0.5)'
          }}>
            <h3 style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '1.25rem',
              fontWeight: '500',
              marginBottom: '12px',
              color: '#f3f4f6'
            }}>
              Why do I need to connect a wallet?
            </h3>
            <p style={{ color: '#d1d5db', lineHeight: '1.6' }}>
              This app uses Solana blockchain for secure, transparent payments and to provide you with ownership of your workout data. The small fee supports ongoing development and maintenance of the platform while ensuring your data privacy.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        width: '100%',
        height: '128px',
        minHeight: '128px',
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
            marginRight: '30px'
          }}>
            <Link href="/faq" style={{
              color: '#a78bfa',
              transition: 'color 150ms ease',
              textDecoration: 'none',
              fontSize: '0.875rem',
              whiteSpace: 'nowrap'
            }}>
              FAQ
            </Link>
            <Link href="/feedback" style={{
              color: '#a78bfa',
              transition: 'color 150ms ease',
              textDecoration: 'none',
              fontSize: '0.875rem',
              whiteSpace: 'nowrap'
            }}>
              Feedback
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
} 