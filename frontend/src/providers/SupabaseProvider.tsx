'use client';

import { createClient } from '@supabase/supabase-js';
import { FC, ReactNode, createContext, useContext } from 'react';

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase environment variables');
}

console.log('Supabase URL:', NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Anon Key:', NEXT_PUBLIC_SUPABASE_ANON_KEY);

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
});

interface SupabaseContextType {
    supabase: typeof supabase;
}

const SupabaseContext = createContext<SupabaseContextType>({ supabase });

export const useSupabase = () => useContext(SupabaseContext);

interface SupabaseProviderProps {
    children: ReactNode;
}

export const SupabaseProvider: FC<SupabaseProviderProps> = ({ children }) => {
    return (
        <SupabaseContext.Provider value={{ supabase }}>
            {children}
        </SupabaseContext.Provider>
    );
}; 