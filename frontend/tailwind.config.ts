import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    // Ensure paths cover all files using Tailwind classes
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}', 
  ],
  theme: {
    extend: {
      // Add theme extensions here if needed later
      // For example, defining custom colors or fonts:
      // colors: {
      //   'solana-purple': '#9945ff',
      //   'solana-green': '#14f195',
      // },
    },
  },
  plugins: [],
}
export default config 