'use client';

import { PaymentButton } from '@/components/PaymentButton';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">VO2 Max Training</h1>
        <div className="mb-8">
          <p className="text-lg mb-4">Start your training session</p>
          <PaymentButton
            amount={0.1}
            onSuccess={() => {
              alert('Payment successful! Starting your training session...');
            }}
            onError={(error) => {
              alert(`Payment failed: ${error.message}`);
            }}
          />
        </div>
      </div>
    </main>
  );
}
