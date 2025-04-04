/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Ensure images from Supabase are allowed
  images: {
    domains: ['supabase.co'],
  },
  // Add custom webpack config if needed
  webpack: (config, { isServer }) => {
    return config;
  },
};

export default nextConfig; 