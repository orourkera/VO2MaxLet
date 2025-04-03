# Feedback Table Setup for VO2Max App

This document explains how to set up the feedback table for the VO2Max Training App in Supabase.

## Overview

The feedback system allows users to submit feedback, bug reports, feature requests, and workout suggestions to the app administrators. The feedback data is stored in a Supabase table called `feedback`.

## Schema

The `feedback` table has the following structure:

- `id` (UUID): Primary key
- `user_id` (UUID, nullable): Reference to the users table
- `feedback_type` (VARCHAR): Type of feedback (general, bug, feature, workout)
- `feedback_text` (TEXT): The actual feedback content
- `status` (VARCHAR): Current status of the feedback (pending, reviewed, implemented, rejected)
- `created_at` (TIMESTAMP): When the feedback was submitted
- `updated_at` (TIMESTAMP): When the feedback was last updated

## Setup Steps

### 1. Run the SQL Script

Run the `feedback-table.sql` script in your Supabase SQL editor to create the table:

```sql
-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    feedback_type VARCHAR(50) NOT NULL,
    feedback_text TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON public.feedback(feedback_type);

-- Set up Row Level Security (RLS)
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can insert their own feedback"
    ON public.feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own feedback"
    ON public.feedback FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all feedback"
    ON public.feedback FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM public.user_apps
        WHERE app_id IN (
            SELECT id FROM public.applications
            WHERE name = 'vo2max-admin'
        )
    ));

-- Add trigger function to update updated_at
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_feedback_timestamp
BEFORE UPDATE ON public.feedback
FOR EACH ROW EXECUTE FUNCTION update_feedback_updated_at();
```

### 2. Configure RLS (Row Level Security)

The SQL script already includes RLS policies that:
- Allow users to insert their own feedback (linked to their user ID)
- Allow anonymous feedback submission (with user_id as NULL)
- Allow users to view only their own feedback
- Allow admin users to view all feedback (users with access to the "vo2max-admin" application)

### 3. Test the Setup

1. Submit feedback through the app's feedback form
2. Check the Supabase dashboard to verify the data is being stored correctly
3. Test that users can only see their own feedback (unless they're admins)

## Usage in Frontend

The feedback form in the app is already configured to send data to this table:

```typescript
// Submit feedback to Supabase
const { data, error: supabaseError } = await supabase
  .from('feedback')
  .insert([{
    user_id: user?.id || null, // If not logged in, store as anonymous
    feedback_type: feedbackType,
    feedback_text: feedbackText,
    status: 'pending'
  }]);
```

## Admin Panel (Future Enhancement)

An admin panel to view and respond to feedback can be implemented as a separate application, utilizing the RLS policies that allow admins to view all feedback. 