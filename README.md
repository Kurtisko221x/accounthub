# Acc Hub - Account Generator Platform

A modern, full-featured account generator platform with FREE and VIP tiers, built with React, TypeScript, Supabase, and Tailwind CSS.

## Features

### 🎯 Core Features
- **FREE Generator**: 10% success rate accounts
- **VIP Generator**: 90% success rate accounts (€5 lifetime)
- **Account Validation**: Automated and manual account testing
- **Category Management**: 38+ account categories
- **Admin Panel**: Comprehensive management dashboard

### 🔧 Admin Features
- Dashboard with analytics
- Account management (add, edit, delete, bulk import)
- Category management
- User management
- Promo code generation and management
- Activity logging
- Export/Import functionality
- Discord webhook integration

### 🎨 Design Features
- Modern dark theme with neon accents
- Smooth animations and transitions
- Responsive design
- Beautiful gradient effects
- Loading states and skeletons

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Shadcn UI + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for database and auth)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Kurtisko221x/accounthub.git
cd accounthub
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run database migrations:
   - Go to your Supabase Dashboard
   - Navigate to SQL Editor
   - Run all migration files from `supabase/migrations/` in order

5. Start development server:
```bash
npm run dev
```

## Deployment on Railway

### Step 1: Prepare for Deployment

1. Make sure all environment variables are set in Railway:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. Build the project locally to test:
```bash
npm run build
```

### Step 2: Deploy to Railway

1. Go to [Railway](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository: `Kurtisko221x/accounthub`
5. Railway will automatically detect it's a Vite project

### Step 3: Configure Railway

Railway should auto-detect the project. If not, configure manually:

1. **Build Command**: `npm install && npm run build` (auto-detected)
2. **Start Command**: `npm run start` (uses PORT from Railway)
3. **Environment Variables** (add in Railway dashboard):
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `PORT` - Railway sets this automatically (don't add manually)

**Note**: The project uses `npm` (not bun) for Railway deployment. The `bun.lockb` file is ignored.

### Step 4: Database Setup

1. Make sure your Supabase migrations are run
2. Railway will handle the frontend deployment
3. Database will be accessed via Supabase (not Railway)

## Project Structure

```
├── src/
│   ├── components/      # React components
│   │   ├── admin/       # Admin panel components
│   │   └── ui/          # Shadcn UI components
│   ├── lib/             # Utility functions
│   ├── pages/           # Page components
│   └── integrations/    # Supabase integration
├── supabase/
│   └── migrations/      # Database migrations
└── public/              # Static assets
```

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
