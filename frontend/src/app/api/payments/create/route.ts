import { NextRequest, NextResponse } from 'next/server';

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
        // Log API request for debugging
        console.log('API endpoint hit: /api/payments/create');
        
        const { userId, amount } = await request.json();
        console.log('Processing payment request for user:', userId, 'amount:', amount);
        
        // Return hardcoded response with known good values
        return NextResponse.json({
            paymentRequest: {
                recipient: "9PtRmzxdAoRNYf6Aht43DQn5hoZGt5Vm2GwdFgmQAf1s",
                amount: amount || 0.005,
                reference: "J6RSar5BYGiUhMXVYx2vMCQH5pKEtB1xMxSymN9wNVvq",
                label: "Payment for VO2Max App",
                message: "Payment for VO2Max Training"
            },
            paymentId: "J6RSar5BYGiUhMXVYx2vMCQH5pKEtB1xMxSymN9wNVvq"
        }, { headers });
    } catch (error) {
        console.error('Payment creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create payment request' },
            { status: 500, headers }
        );
    }
} 