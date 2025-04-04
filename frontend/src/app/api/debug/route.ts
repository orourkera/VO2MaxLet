import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envVars = {
      SUPABASE_URL: process.env.SUPABASE_URL ? 'present' : 'missing',
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 'present' : 'missing',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'present' : 'missing',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing'
    };

    // Try to connect to Supabase
    let supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    let supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        status: 'error',
        message: 'Missing Supabase credentials',
        environment: envVars
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Try a simple query to test connection
    const { data, error } = await supabase
      .from('applications')
      .select('id, name')
      .limit(5);
      
    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Failed to query Supabase',
        error: error.message,
        environment: envVars
      }, { status: 500 });
    }
    
    // Success
    return NextResponse.json({
      status: 'success',
      message: 'Supabase connection working',
      applications: data,
      environment: envVars
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Unexpected error',
      error: String(error)
    }, { status: 500 });
  }
} 