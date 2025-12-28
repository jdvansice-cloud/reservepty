# ReservePTY v0.44.9

Luxury Asset Management Platform

## Quick Start

1. Clone and install:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

3. Run development server:
```bash
npm run dev
```

4. Deploy to Vercel:
```bash
vercel
```

## Features

- **Multi-tenant SaaS** - Organizations manage their own assets
- **Asset Sections** - Planes, Helicopters, Residences, Boats
- **Tier-based Access** - Priority booking with configurable rules
- **Bilingual** - English and Spanish support
- **SMTP Email** - Optional email invitations with manual link fallback

## Tech Stack

- Next.js 14 (App Router)
- Supabase (Auth, Database, Storage)
- Tailwind CSS
- TypeScript
- Nodemailer

## Version History

See CHANGELOG.md for details.
