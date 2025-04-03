import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
}

// Create a Supabase client with the service role key
export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// User operations
export const userService = {
    async createUser(walletAddress: string) {
        const { data, error } = await supabase
            .from('users')
            .insert({ wallet_address: walletAddress })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async getUserByWallet(walletAddress: string) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', walletAddress)
            .single();
        
        if (error) throw error;
        return data;
    }
};

// Application operations
export const appService = {
    async createApp(name: string, description?: string) {
        const { data, error } = await supabase
            .from('applications')
            .insert({ name, description })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async getAppById(id: string) {
        const { data, error } = await supabase
            .from('applications')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    }
};

// Training session operations
export const trainingService = {
    async createSession(userId: string, appId: string, sessionData: any) {
        const { data, error } = await supabase
            .from('training_sessions')
            .insert({
                user_id: userId,
                app_id: appId,
                session_data: sessionData
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async getSessionsByUser(userId: string) {
        const { data, error } = await supabase
            .from('training_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    }
};

// Payment operations
export const paymentService = {
    async createPayment(userId: string, appId: string, amount: number, currency: string, transactionHash: string) {
        const { data, error } = await supabase
            .from('payments')
            .insert({
                user_id: userId,
                app_id: appId,
                amount,
                currency,
                transaction_hash: transactionHash,
                status: 'pending'
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async updatePaymentStatus(transactionHash: string, status: 'completed' | 'failed') {
        const { data, error } = await supabase
            .from('payments')
            .update({ status })
            .eq('transaction_hash', transactionHash)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async getPaymentsByUser(userId: string) {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    }
}; 