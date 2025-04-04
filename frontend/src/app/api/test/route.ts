import { NextRequest, NextResponse } from 'next/server';

// A very simple route to test API access
export async function GET(request: NextRequest) {
  console.log('💡 TEST API ROUTE HIT');
  
  return NextResponse.json({
    message: 'API route is working',
    timestamp: new Date().toISOString(),
    url: request.url,
    headers: Object.fromEntries([...request.headers.entries()].map(([k, v]) => [k, typeof v === 'string' && v.length > 100 ? v.substring(0, 100) + '...' : v])),
    env: {
      NEXT_PUBLIC_APP_ID: process.env.NEXT_PUBLIC_APP_ID || 'not set',
      // Don't include sensitive values
      HAS_SUPABASE_URL: !!process.env.SUPABASE_URL,
      HAS_SUPABASE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
      NODE_ENV: process.env.NODE_ENV
    }
  });
}

// Add CORS support
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 