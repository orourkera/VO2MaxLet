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
        // Log for debugging - very distinctive to find in logs
        console.log('🚨🚨🚨 EMERGENCY VERIFY ENDPOINT HIT 🚨🚨🚨');
        console.log('Request URL:', request.url);
        
        // Parse request body
        const body = await request.json();
        console.log('Request body:', body);
        
        // Always return success
        return NextResponse.json({
            verified: true,
            timestamp: new Date().toISOString()
        }, { headers });
    } catch (error) {
        console.error('🚨 EMERGENCY VERIFY ERROR:', error);
        return NextResponse.json(
            { error: 'Failed to process emergency verification', details: String(error) },
            { status: 500, headers }
        );
    }
} 