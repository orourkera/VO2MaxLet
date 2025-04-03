import { FC, ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSupabase } from './SupabaseProvider';

interface User {
    id: string;
    wallet_address: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: Error | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
    const { publicKey, connected } = useWallet();
    const { supabase } = useSupabase();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const handleAuth = async () => {
            if (!publicKey || !connected) {
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Check if user exists
                const { data: existingUser, error: fetchError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('wallet_address', publicKey.toString())
                    .single();

                if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                    throw fetchError;
                }

                if (existingUser) {
                    setUser(existingUser);
                } else {
                    // Create new user
                    const { data: newUser, error: createError } = await supabase
                        .from('users')
                        .insert({ wallet_address: publicKey.toString() })
                        .select()
                        .single();

                    if (createError) throw createError;
                    setUser(newUser);
                }
            } catch (err) {
                setError(err as Error);
                console.error('Auth error:', err);
            } finally {
                setLoading(false);
            }
        };

        handleAuth();
    }, [publicKey, connected, supabase]);

    return (
        <AuthContext.Provider value={{ user, loading, error }}>
            {children}
        </AuthContext.Provider>
    );
}; 