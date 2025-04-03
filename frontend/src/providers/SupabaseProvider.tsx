'use client';

import { createClient } from '@supabase/supabase-js';
import { FC, ReactNode, createContext, useContext } from 'react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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