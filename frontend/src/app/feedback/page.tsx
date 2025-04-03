'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { useSupabase } from '@/providers/SupabaseProvider';
import Header from '@/components/Header';

export default function FeedbackPage() {
  const { user } = useAuth();
  const { supabase } = useSupabase();
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Submit feedback to Supabase
      const { data, error: supabaseError } = await supabase
        .from('feedback')
        .insert([{
          user_id: user?.id || null, // If not logged in, store as anonymous
          feedback_type: feedbackType,
          feedback_text: feedbackText,
          status: 'pending'
        }]);

      if (supabaseError) {
        console.error('Error submitting feedback:', supabaseError);
        throw new Error(supabaseError.message);
      }

      console.log('Feedback submitted successfully:', data);

      // Clear form and show success message
      setFeedbackText('');
      setFeedbackType('general');
      setIsSubmitted(true);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      setError('There was a problem submitting your feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        padding: '32px 16px',
        maxWidth: '90%',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <h1 style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'clamp(1.5rem, 5vw, 2rem)',
          fontWeight: '500',
          marginBottom: '24px',
          color: '#ffffff',
          textAlign: 'center'
        }}>
          Submit Feedback
        </h1>

        {isSubmitted ? (
          <div style={{
            backgroundColor: 'rgba(5, 150, 105, 0.2)',
            border: '1px solid #059669',
            borderRadius: '12px',
            padding: 'clamp(16px, 5vw, 24px)',
            textAlign: 'center',
            width: '100%',
            maxWidth: '560px'
          }}>
            <h3 style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'clamp(1.1rem, 4vw, 1.25rem)',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#10b981'
            }}>
              Thank You!
            </h3>
            <p style={{ marginBottom: '16px' }}>
              Your feedback has been submitted successfully.
            </p>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '16px',
              flexWrap: 'wrap' // Allow buttons to wrap on very small screens
            }}>
              <button 
                onClick={() => setIsSubmitted(false)}
                style={{
                  backgroundColor: 'rgba(79, 70, 229, 0.6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'background-color 150ms ease',
                  minWidth: '120px'
                }}
              >
                Submit Another
              </button>
              <Link href="/" style={{
                backgroundColor: 'rgba(31, 41, 55, 0.6)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '0.875rem',
                textDecoration: 'none',
                display: 'inline-block',
                transition: 'background-color 150ms ease',
                textAlign: 'center',
                minWidth: '120px'
              }}>
                Return Home
              </Link>
            </div>
          </div>
        ) : (
          <form 
            onSubmit={handleSubmit}
            style={{
              backgroundColor: 'rgba(31, 41, 55, 0.5)',
              borderRadius: '12px',
              padding: 'clamp(16px, 5vw, 32px)',
              border: '1px solid rgba(55, 65, 81, 0.5)',
              width: '100%',
              maxWidth: '560px'
            }}
          >
            {error && (
              <div style={{
                backgroundColor: 'rgba(220, 38, 38, 0.2)',
                color: '#f87171',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '24px',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}
            
            <div style={{ marginBottom: '24px' }}>
              <label 
                htmlFor="feedbackType"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#f3f4f6'
                }}
              >
                Feedback Type
              </label>
              <select
                id="feedbackType"
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(55, 65, 81, 0.7)',
                  border: '1px solid #4b5563',
                  borderRadius: '8px',
                  color: '#f3f4f6',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              >
                <option value="general">General Feedback</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="workout">Workout Suggestion</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label 
                htmlFor="feedbackText"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: '#f3f4f6'
                }}
              >
                Your Feedback
              </label>
              <textarea
                id="feedbackText"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Tell us what you think or suggest improvements..."
                required
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(55, 65, 81, 0.7)',
                  border: '1px solid #4b5563',
                  borderRadius: '8px',
                  color: '#f3f4f6',
                  fontSize: '0.95rem',
                  resize: 'vertical',
                  outline: 'none',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="submit"
                disabled={isSubmitting || !feedbackText.trim()}
                style={{
                  background: 'linear-gradient(to right, #9945ff, #14f195)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontSize: '0.95rem',
                  cursor: isSubmitting || !feedbackText.trim() ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting || !feedbackText.trim() ? 0.7 : 1,
                  transition: 'all 150ms ease',
                  fontFamily: 'var(--font-inter)',
                  fontWeight: '500',
                  width: 'auto',
                  maxWidth: '100%'
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        )}
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