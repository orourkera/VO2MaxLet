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
            url: supabaseUrl ? 'present' : 'missing',
            key: supabaseKey ? 'present' : 'missing'
        });

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json(
                { error: 'Server configuration error' },
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
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            console.error(`User with ID "${userId}" not found:`, userError);
            return NextResponse.json(
                { error: `User not found` },
                { status: 404, headers }
            );
        }

        // Generate a unique payment ID
        const paymentId = crypto.randomUUID();

        // Use the hardcoded application ID we know exists
        const appId = '734e89bd-7072-470d-86b5-ff35d83c3fe7';

        // Create payment record
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
                { error: 'Failed to create payment record' },
                { status: 500, headers }
            );
        }

        // Create payment request
        const paymentRequest = {
            recipient: new PublicKey(user.wallet_address),
            amount: amount,
            reference: new PublicKey(paymentId),
            label: `Payment for VO2Max App`,
            message: `Payment of ${amount} SOL for VO2Max Application`
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