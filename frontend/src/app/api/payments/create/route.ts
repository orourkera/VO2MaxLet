import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PublicKey } from '@solana/web3.js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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
        console.log('Fetching application details for name: vo2max-app');
        const { data: app, error: appError } = await supabase
            .from('applications')
            .select('*')
            .eq('name', 'vo2max-app')
            .single();

        console.log('Application query result:', { app, error: appError });

        if (appError || !app) {
            console.error('Application "vo2max-app" not found.');
            return NextResponse.json(
                { error: 'Application not found' },
                { status: 404, headers }
            );
        }

        // Create a payment record
        const paymentId = crypto.randomUUID();
        const { error: paymentError } = await supabase
            .from('payments')
            .insert([
                {
                    id: paymentId,
                    user_id: userId,
                    app_id: app.id,
                    amount: amount,
                    currency: 'SOL',
                    status: 'pending',
                    transaction_hash: 'pending' // Will be updated when payment is verified
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
            label: `Payment for ${app.name}`,
            message: `Payment of ${amount} SOL for ${app.name}`
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