import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PublicKey } from '@solana/web3.js';

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
    // Log API request for debugging
    console.log('⚡️ API ROUTE HIT: /api/payments/create', {
        method: 'POST',
        url: request.url,
        headers: Object.fromEntries([...request.headers.entries()].map(([k, v]) => [k, typeof v === 'string' && v.length > 100 ? v.substring(0, 100) + '...' : v]))
    });

    // Add CORS headers to the response
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    try {
        // Initialize Supabase client with server-side credentials
        // First try service key, then fall back to anon key if needed
        let supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        let supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        console.log('Supabase initialization:', {
            url: supabaseUrl ? supabaseUrl.substring(0, 4) + '...' : 'missing',
            key: supabaseKey ? supabaseKey.substring(0, 4) + '...' : 'missing',
            env: {
                SUPABASE_URL: process.env.SUPABASE_URL ? 'present' : 'missing',
                SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 'present' : 'missing',
                NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'present' : 'missing',
                NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing'
            }
        });

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json(
                { error: 'Server configuration error', details: 'Missing Supabase credentials' },
                { status: 500, headers }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

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
        const userQuery = await supabase
            .from('users')
            .select('*')
            .eq('id', userId);
        
        console.log('User query result:', {
            data: userQuery.data ? 'Found user data' : 'No user data',
            count: userQuery.data?.length,
            error: userQuery.error ? userQuery.error.message : null
        });

        if (userQuery.error) {
            console.error(`Error finding user with ID "${userId}":`, userQuery.error);
            return NextResponse.json(
                { error: `Database error: ${userQuery.error.message}`, details: 'User query failed' },
                { status: 500, headers }
            );
        }

        if (!userQuery.data || userQuery.data.length === 0) {
            console.error(`User with ID "${userId}" not found.`);
            return NextResponse.json(
                { error: 'User not found', userId },
                { status: 404, headers }
            );
        }

        const user = userQuery.data[0];
        
        // Generate a unique payment ID
        const paymentId = crypto.randomUUID();
        
        // Use the hardcoded application ID we know exists
        const appId = '734e89bd-7072-470d-86b5-ff35d83c3fe7';
        
        // Skip the application lookup entirely since we know the ID
        console.log('Using known application ID:', appId);
        
        // Create payment record directly
        const { error: paymentError } = await supabase
            .from('payments')
            .insert({
                id: paymentId,
                user_id: userId,
                app_id: appId,
                amount: amount,
                currency: 'SOL',
                status: 'pending',
                transaction_hash: 'pending'
            });

        if (paymentError) {
            console.error('Error creating payment record:', paymentError);
            return NextResponse.json(
                { error: 'Failed to create payment record', details: paymentError.message },
                { status: 500, headers }
            );
        }

        // Create payment request
        const paymentRequest = {
            recipient: new PublicKey(user.wallet_address),
            amount: amount,
            reference: new PublicKey(paymentId),
            label: `Payment for VO2Max App`,
            message: `Payment of ${amount} SOL for VO2Max App`
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