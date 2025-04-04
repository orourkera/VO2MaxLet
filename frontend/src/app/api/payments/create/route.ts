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
        // EMERGENCY BRANCH - Return a mock response to test if API is accessible
        const { userId, amount } = await request.json();
        console.log('Received payment request with userId:', userId, 'amount:', amount);
        
        // Generate UUID for payment
        const paymentId = crypto.randomUUID();
        
        // Return a mock response without doing any database operations
        return NextResponse.json(
            { 
                paymentRequest: {
                    recipient: new PublicKey('9PtRmzxdAoRNYf6Aht43DQn5hoZGt5Vm2GwdFgmQAf1s'), // Example wallet
                    amount: amount,
                    reference: new PublicKey(paymentId),
                    label: `Payment for VO2Max App`,
                    message: `Payment of ${amount} SOL for VO2Max App`
                },
                paymentId
            },
            { headers }
        );
    } catch (error) {
        console.error('Payment creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create payment request', details: String(error) },
            { status: 500, headers }
        );
    }
} 