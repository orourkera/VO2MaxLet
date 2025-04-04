import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Connection, PublicKey } from '@solana/web3.js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Solana connection
const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!);

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
        const { transactionHash, paymentId } = await request.json();

        if (!transactionHash || !paymentId) {
            return NextResponse.json(
                { error: 'Missing required parameters: transactionHash and paymentId' },
                { status: 400, headers }
            );
        }

        // Verify the transaction on Solana
        try {
            const transaction = await connection.getTransaction(transactionHash, {
                maxSupportedTransactionVersion: 0
            });

            if (!transaction) {
                return NextResponse.json(
                    { error: 'Transaction not found on Solana network yet. Please wait and try again.' },
                    { status: 404, headers }
                );
            }

            // Update payment status in database
            const { error: updateError } = await supabase
                .from('payments')
                .update({ status: 'completed', transaction_signature: transactionHash })
                .eq('id', paymentId);

            if (updateError) {
                console.error('Error updating payment status:', updateError);
                if (updateError.code === 'PGRST116') {
                    return NextResponse.json(
                        { error: 'Payment record not found for the provided payment ID.' },
                        { status: 404, headers }
                    );
                }
                return NextResponse.json(
                    { error: 'Failed to update payment status' },
                    { status: 500, headers }
                );
            }

            return NextResponse.json(
                { verified: true },
                { headers }
            );
        } catch (error) {
            console.error('Error verifying transaction:', error);
            return NextResponse.json(
                { error: 'Failed to verify transaction' },
                { status: 500, headers }
            );
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        return NextResponse.json(
            { error: 'Failed to verify payment' },
            { status: 500, headers }
        );
    }
} 