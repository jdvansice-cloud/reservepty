# ReservePTY

Premium multi-tenant SaaS platform for managing luxury assets including private planes, helicopters, residences, and boats.

## 🚀 Features

### Customer Portal
- **Dashboard** - Overview of assets, bookings, and member activity
- **Asset Management** - CRUD operations for planes, helicopters, residences, boats
- **Unified Calendar** - View all bookings across assets
- **Member Management** - Invite and manage organization members
- **Tier System** - Priority-based booking with customizable rules
- **Settings** - Manage company info, billing, and sections

### Admin Portal
- **Platform Dashboard** - KPIs, revenue, and organization metrics
- **Organization Management** - View, create, and manage all organizations
- **User Management** - Platform-wide user administration
- **Complimentary Access** - Grant free memberships
- **Activity Logs** - Audit trail of all platform actions
- **Platform Settings** - Configure pricing, sections, and security

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Styling** | Tailwind CSS |
| **Backend** | Supabase (PostgreSQL, Auth, Storage) |
| **Deployment** | Vercel |
| **Repository** | GitHub |

## 🎨 Design System

### Colors
- **Primary Background:** `#0a1628` (Deep Navy)
- **Primary Highlight:** `#c8b273` (Champagne Gold)
- **Surface:** `#1a2942` (Card Background)
- **Admin Accent:** `#ef4444` (Red)

### Typography
- **Display:** Playfair Display
- **Body:** DM Sans

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn
- Supabase project

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/reservepty.git
cd reservepty

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_DEV_MODE=true
```

## 🚢 Deploy to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/reservepty&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,NEXT_PUBLIC_DEV_MODE)

### Option 2: Manual Setup

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/reservepty.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key
   - `NEXT_PUBLIC_DEV_MODE` = `false` (for production)

4. **Deploy!**

## 🗄 Database Setup

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for complete instructions.

Quick steps:
1. Run `supabase/migrations/000_reset_database.sql` (if resetting)
2. Run `supabase/migrations/001_initial_schema.sql`
3. Run `supabase/migrations/002_seed_data.sql`

## 🧪 Development Mode

When `NEXT_PUBLIC_DEV_MODE=true`:
- Quick Access button bypasses authentication
- Dev Mode indicator shows in sidebar
- Mock organization with all sections enabled
- Unlimited seats for testing

## 📁 Project Structure

```
src/
├── app/
│   ├── (admin)/           # Admin portal pages
│   ├── (admin-auth)/      # Admin authentication
│   ├── (auth)/            # Customer authentication
│   ├── (onboarding)/      # Onboarding flow
│   ├── (portal)/          # Customer portal pages
│   └── page.tsx           # Landing page
├── components/            # Reusable components
├── contexts/              # React contexts
├── lib/
│   ├── api/               # Supabase API services
│   └── supabase/          # Supabase client setup
└── types/                 # TypeScript types
```

## 📝 Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0-alpha | Dec 26, 2025 | Complete UI, DB schema ready |

## 📄 License

Copyright © 2025 ReservePTY. All rights reserved.
