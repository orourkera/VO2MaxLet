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

export async function GET(request: NextRequest) {
    // Add CORS headers to the response
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    try {
        console.log('🔥 SKIP PAYMENT ENDPOINT HIT 🔥');
        
        return NextResponse.json({
            success: true,
            message: "Payment skipped",
            timestamp: new Date().toISOString()
        }, { headers });
    } catch (error) {
        console.error('Skip payment error:', error);
        return NextResponse.json(
            { error: 'Failed', details: String(error) },
            { status: 500, headers }
        );
    }
} 