import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import "../styles/external.css";
import { SolanaProvider } from "@/providers/SolanaProvider";
import { SupabaseProvider } from "@/providers/SupabaseProvider";
import { AuthProvider } from "@/providers/AuthProvider";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: "VO2 Max Training",
  description: "Norwegian-style VO2 max training sessions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable}`}>
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
