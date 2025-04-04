import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PublicKey } from '@solana/web3.js';

// Initialize Supabase client with server-side credentials
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase server credentials. Please check SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test the connection immediately
const testConnection = async () => {
    try {
        const { data, error } = await supabase.from('applications').select('count');
        console.log('Supabase connection test:', {
            success: !error,
            error: error?.message,
            count: data
        });
    } catch (e) {
        console.error('Supabase connection test failed:', e);
    }
};

testConnection();

// CORS preflight
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

export async function POST(request: NextRequest) {
    // Add CORS headers to the response
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    try {
        const { userId, amount } = await request.json();
        console.log('Received request with userId:', userId, 'amount:', amount);

        if (!userId || !amount) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400, headers }
            );
        }

        // First, fetch the user details
        console.log('Fetching user details for ID:', userId);
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        console.log('User query result:', { user, error: userError });

        if (userError || !user) {
            console.error(`User with ID "${userId}" not found.`);
            return NextResponse.json(
                { error: `User not found` },
                { status: 404, headers }
            );
        }

        // Then, fetch the application details
        console.log('Fetching application details...');

        // Try direct query first with exact ID
        const appId = '734e89bd-7072-470d-86b5-ff35d83c3fe7'; // The exact ID we see in the database
        console.log('Trying direct query by ID:', appId);
        
        const directQuery = await supabase
            .from('applications')
            .select('*')
            .eq('id', appId)
            .single();
            
        console.log('Direct query result:', {
            data: directQuery.data,
            error: directQuery.error,
            status: directQuery.status,
            statusText: directQuery.statusText
        });

        if (directQuery.data) {
            console.log('Found application by ID');
            return NextResponse.json(
                { 
                    paymentRequest: {
                        recipient: new PublicKey(user.wallet_address),
                        amount: amount,
                        reference: new PublicKey(crypto.randomUUID()),
                        label: `Payment for ${directQuery.data.name}`,
                        message: `Payment of ${amount} SOL for ${directQuery.data.name}`
                    },
                    paymentId: crypto.randomUUID()
                },
                { headers }
            );
        }

        // If direct query failed, try name query
        console.log('Direct query failed, trying name query...');
        const nameQuery = await supabase
            .from('applications')
            .select('*')
            .eq('name', 'vo2max-app')
            .single();

        console.log('Name query result:', {
            data: nameQuery.data,
            error: nameQuery.error,
            status: nameQuery.status,
            statusText: nameQuery.statusText,
            query: 'vo2max-app'
        });

        if (!nameQuery.data) {
            console.error('Application query failed');
            console.error('Error details:', {
                error: nameQuery.error,
                status: nameQuery.status,
                statusText: nameQuery.statusText
            });
            return NextResponse.json(
                { error: 'Application not found. Database query failed.' },
                { status: 404, headers }
            );
        }

        // Create payment record
        const paymentId = crypto.randomUUID();
        const { error: paymentError } = await supabase
            .from('payments')
            .insert([
                {
                    id: paymentId,
                    user_id: userId,
                    app_id: nameQuery.data.id,
                    amount: amount,
                    currency: 'SOL',
                    status: 'pending',
                    transaction_hash: 'pending'
                }
            ]);

        if (paymentError) {
            console.error('Error creating payment:', paymentError);
            return NextResponse.json(
                { error: 'Failed to create payment' },
                { status: 500, headers }
            );
        }

        // Create payment request
        const paymentRequest = {
            recipient: new PublicKey(user.wallet_address),
            amount: amount,
            reference: new PublicKey(paymentId),
            label: `Payment for ${nameQuery.data.name}`,
            message: `Payment of ${amount} SOL for ${nameQuery.data.name}`
        };

        return NextResponse.json(
            { paymentRequest, paymentId },
            { headers }
        );
    } catch (error) {
        console.error('Payment creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create payment request' },
            { status: 500, headers }
        );
    }
} 