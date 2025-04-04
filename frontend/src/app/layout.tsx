import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";
import "../styles/external.css";
import { SolanaProvider } from "@/providers/SolanaProvider";
import { SupabaseProvider } from "@/providers/SupabaseProvider";
import { AuthProvider } from "@/providers/AuthProvider";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700']
});

const merriweather = Merriweather({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-merriweather',
  weight: ['300', '400', '700']
});

export const metadata: Metadata = {
  title: "VO2 Max Training",
  description: "Norwegian-style VO2 max training sessions",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' }
    ]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Log environment variables to help debug API issues
  if (typeof window !== 'undefined') {
    console.log('Environment Debug [Layout]:', {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'not set',
      NEXT_PUBLIC_APP_ID: process.env.NEXT_PUBLIC_APP_ID || 'not set',
      origin: window.location.origin,
      host: window.location.host,
      pathname: window.location.pathname
    });
  }

  return (
    <html lang="en" className={`${inter.variable} ${merriweather.variable}`}>
      <body className="font-sans">
        <SupabaseProvider>
          <SolanaProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </SolanaProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}