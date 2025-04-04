# VO2 Max Training App

A mobile web application for Norwegian-style VO2 max training sessions, featuring Solana wallet integration for payments.

## Features

- Solana wallet authentication
- Secure payment processing
- VO2 max training session management
- Real-time workout tracking
- Progress analytics
- Modern UI with Tailwind CSS

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Node.js, Express.js
- Database: Supabase
- Authentication: Solana Wallet Adapter
- Payments: Solana Pay

## Local Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Solana CLI tools
- Supabase account
- Vercel account (for deployment)

### Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd vo2max-app
   ```

2. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install

   # Install backend dependencies
   cd ../backend
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local` in the frontend directory
   - Copy `.env.example` to `.env` in the backend directory
   - Fill in the required environment variables

4. Start the development servers:
   ```bash
   # Start backend server
   cd backend
   npm run dev

   # Start frontend server
   cd frontend
   npm run dev
   ```

## Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set up environment variables in Vercel:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - NEXT_PUBLIC_APP_ID
4. Deploy

### Backend (Vercel)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set up environment variables in Vercel
4. Configure the build settings to use the backend directory
5. Deploy

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_ID=your_app_id
```

### Backend (.env)
```
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
APP_ID=your_app_id
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 