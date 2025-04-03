import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SolanaProvider } from "@/providers/SolanaProvider";
import { SupabaseProvider } from "@/providers/SupabaseProvider";
import { AuthProvider } from "@/providers/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en">
      <body className={inter.className}>
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
