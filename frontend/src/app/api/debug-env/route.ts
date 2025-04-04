import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Capture the request URL and headers
  const requestInfo = {
    url: request.url,
    headers: Object.fromEntries([...request.headers.entries()]),
    referrer: request.headers.get('referer') || 'none',
    userAgent: request.headers.get('user-agent') || 'none'
  };

  // Capture environment variables (redact sensitive ones)
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'not set',
    NEXT_PUBLIC_APP_ID: process.env.NEXT_PUBLIC_APP_ID,
    VERCEL_URL: process.env.VERCEL_URL || 'not set',
    VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
  };

  // Get cookies
  const cookies = Object.fromEntries([...request.cookies.getAll().map(c => [c.name, c.value])]);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: envInfo,
    request: requestInfo,
    cookies: cookies,
    message: 'Debug environment endpoint'
  });
} 