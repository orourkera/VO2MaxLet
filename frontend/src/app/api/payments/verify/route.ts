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
        console.log('API endpoint hit: /api/payments/verify');
        
        const { transactionHash, paymentId } = await request.json();
        console.log('Verifying payment:', { transactionHash, paymentId });

        if (!transactionHash || !paymentId) {
            return NextResponse.json(
                { error: 'Missing required parameters: transactionHash and paymentId' },
                { status: 400, headers }
            );
        }

        // Always return success for now
        return NextResponse.json(
            { verified: true },
            { headers }
        );
    } catch (error) {
        console.error('Payment verification error:', error);
        return NextResponse.json(
            { error: 'Failed to verify payment' },
            { status: 500, headers }
        );
    }
} 