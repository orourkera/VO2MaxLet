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
        const appName = 'vo2max-app';

        if (!userId || !amount) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400, headers }
            );
        }

        // Fetch the application details by name
        const { data: app, error: appError } = await supabase
            .from('apps')
            .select('*')
            .eq('name', appName)
            .single();

        if (appError || !app) {
            console.error(`Application with name "${appName}" not found.`);
            return NextResponse.json(
                { error: `Application "${appName}" not found` },
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
                    status: 'pending'
                }
            ]);

        if (paymentError) {
            console.error('Error creating payment:', paymentError);
            return NextResponse.json(
                { error: 'Failed to create payment' },
                { status: 500, headers }
            );
        }

        // Create payment request (you'll need to implement the actual Solana Pay logic here)
        const paymentRequest = {
            recipient: new PublicKey(app.wallet_address),
            amount: amount,
            reference: new PublicKey(paymentId),
            label: `Payment for ${appName}`,
            message: `Payment of ${amount} SOL for ${appName}`
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