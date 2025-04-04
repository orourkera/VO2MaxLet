import { NextRequest, NextResponse } from 'next/server';
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
        // Log for debugging - very distinctive to find in logs
        console.log('🚨🚨🚨 EMERGENCY PAYMENT ENDPOINT HIT 🚨🚨🚨');
        console.log('Request URL:', request.url);
        
        // Parse request body
        const body = await request.json();
        console.log('Request body:', body);
        
        // Create a valid reference - PublicKey needs a valid base58 string
        // We'll use a known valid public key for testing purposes
        const referenceKey = new PublicKey('J6RSar5BYGiUhMXVYx2vMCQH5pKEtB1xMxSymN9wNVvq');
        const recipientKey = new PublicKey('9PtRmzxdAoRNYf6Aht43DQn5hoZGt5Vm2GwdFgmQAf1s');
        
        // Always return a successful response with hardcoded values
        const paymentId = crypto.randomUUID();
        
        return NextResponse.json({
            paymentRequest: {
                recipient: recipientKey.toString(), // Convert to string for serialization
                amount: body.amount || 0.005,
                reference: referenceKey.toString(), // Convert to string for serialization
                label: 'Payment for VO2Max App - EMERGENCY',
                message: 'Payment for VO2Max App - EMERGENCY PATH'
            },
            paymentId: paymentId
        }, { headers });
    } catch (error) {
        console.error('🚨 EMERGENCY PAYMENT ERROR:', error);
        return NextResponse.json(
            { error: 'Failed to process emergency payment', details: String(error) },
            { status: 500, headers }
        );
    }
} 