'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

interface WorkoutSession {
  id: number;
  user_id: string;
  session_type: string;
  duration: number;
  completed: boolean;
  created_at: string;
  warmup_duration: number;
  high_intensity_duration: number;
  recovery_duration: number;
  cooldown_duration: number;
  early_termination: boolean;
}

// Format seconds to HH:MM:SS
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  const parts = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (remainingSeconds || (!hours && !minutes)) parts.push(`${remainingSeconds}s`);
  
  return parts.join(' ');
};

// Format date to display in a user-friendly way
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function WorkoutHistory() {
  const { user, loading } = useAuth();
  const { supabase } = useSupabase();
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // If not loading and no user, redirect to home
    if (!loading && !user) {
      router.push('/');
      return;
    }

    // Fetch workout history if user is logged in
    if (user) {
      fetchWorkoutHistory();
    }
  }, [user, loading, router]);

  const fetchWorkoutHistory = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching workout history:', error);
        return;
      }

      setWorkouts(data || []);
    } catch (err) {
      console.error('Failed to fetch workout history:', err);
    } finally {
      setIsLoading(false);
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
        padding: '32px 24px',
        maxWidth: '900px',
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
          Your Workout History
        </h1>

        {isLoading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '64px 0',
            color: '#a1a1aa'
          }}>
            <div style={{
              height: '40px',
              width: '40px',
              borderRadius: '50%',
              borderBottom: '2px solid #c084fc',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        ) : workouts.length === 0 ? (
          <div style={{
            backgroundColor: 'rgba(31, 41, 55, 0.5)',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
            color: '#9ca3af'
          }}>
            <p>You haven't completed any workouts yet.</p>
            <Link href="/" style={{
              color: '#a78bfa',
              marginTop: '16px',
              display: 'inline-block',
              textDecoration: 'none'
            }}>
              Start your first workout
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {workouts.map((workout) => (
              <div 
                key={workout.id}
                style={{
                  backgroundColor: 'rgba(31, 41, 55, 0.5)',
                  borderRadius: '12px',
                  padding: '24px',
                  border: '1px solid rgba(55, 65, 81, 0.5)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div>
                    <h3 style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '1.25rem',
                      fontWeight: '500',
                      marginBottom: '4px',
                      color: '#f3f4f6'
                    }}>
                      VO2 Max Training
                    </h3>
                    <p style={{
                      color: '#9ca3af',
                      fontSize: '0.875rem'
                    }}>
                      {formatDate(workout.created_at)}
                    </p>
                  </div>
                  <div style={{
                    backgroundColor: workout.completed ? '#047857' : '#b45309',
                    color: 'white',
                    borderRadius: '9999px',
                    padding: '4px 12px',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {workout.completed ? 'Completed' : 'Partial'}
                  </div>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  <div>
                    <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '4px' }}>
                      Total Duration
                    </div>
                    <div style={{ color: '#f3f4f6', fontSize: '1rem', fontWeight: '500' }}>
                      {formatDuration(workout.duration)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '4px' }}>
                      Warm-up Time
                    </div>
                    <div style={{ color: '#3b82f6', fontSize: '1rem', fontWeight: '500' }}>
                      {formatDuration(workout.warmup_duration)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '4px' }}>
                      High Intensity
                    </div>
                    <div style={{ color: '#ef4444', fontSize: '1rem', fontWeight: '500' }}>
                      {formatDuration(workout.high_intensity_duration)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '4px' }}>
                      Recovery
                    </div>
                    <div style={{ color: '#10b981', fontSize: '1rem', fontWeight: '500' }}>
                      {formatDuration(workout.recovery_duration)}
                    </div>
                  </div>
                </div>
                
                {!workout.completed && workout.early_termination && (
                  <p style={{
                    color: '#d97706',
                    fontSize: '0.875rem',
                    marginTop: '12px',
                    fontStyle: 'italic'
                  }}>
                    This workout was ended early.
                  </p>
                )}
              </div>
            ))}
          </div>
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