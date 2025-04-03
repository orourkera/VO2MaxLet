'use client';

import { FC, ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSupabase } from './SupabaseProvider';

interface User {
    id: string;
    walletAddress: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    error: null,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
    children: ReactNode;
}

// Function to generate a UUID v4
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
    const { publicKey, connected } = useWallet();
    const { supabase } = useSupabase();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkUser = async () => {
            if (!publicKey) {
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const walletAddress = publicKey.toString();
                console.log('Checking user for wallet:', walletAddress);

                // Check if user exists in Supabase
                const { data: existingUser, error: fetchError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('wallet_address', walletAddress)
                    .single();

                if (fetchError) {
                    console.log('Fetch error:', fetchError);
                    
                    if (fetchError.code === 'PGRST116') {
                        console.log('No user found, creating new user...');
                        
                        const newUserId = uuidv4();
                        // Create new user with explicit UUID
                        const { data: newUser, error: createError } = await supabase
                            .from('users')
                            .insert([{ 
                                id: newUserId,
                                wallet_address: walletAddress 
                            }])
                            .select()
                            .single();

                        if (createError) {
                            console.error('Create user error:', createError);
                            console.error('Create user error details:', {
                                message: createError.message,
                                details: createError.details,
                                hint: createError.hint,
                                code: createError.code
                            });
                            throw new Error(`Failed to create user account: ${createError.message}`);
                        }

                        if (!newUser) {
                            throw new Error('No user data returned after creation');
                        }

                        console.log('New user created:', newUser);
                        setUser({
                            id: newUser.id,
                            walletAddress: newUser.wallet_address,
                        });
                    } else {
                        console.error('Fetch user error:', fetchError);
                        throw new Error(`Failed to fetch user data: ${fetchError.message}`);
                    }
                } else if (existingUser) {
                    console.log('Existing user found:', existingUser);
                    setUser({
                        id: existingUser.id,
                        walletAddress: existingUser.wallet_address,
                    });
                }
            } catch (err) {
                const errorMessage = err instanceof Error 
                    ? err.message 
                    : typeof err === 'string' 
                        ? err 
                        : 'An unexpected error occurred';
                
                console.error('Auth error details:', {
                    error: err,
                    message: errorMessage,
                    publicKey: publicKey?.toString(),
                });
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        if (connected) {
            checkUser();
        } else {
            setUser(null);
            setLoading(false);
        }
    }, [publicKey, connected, supabase]);

    return (
        <AuthContext.Provider value={{ user, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
}; 